import archiver from 'archiver';
import { Response } from 'express';
import { logger } from './logger';
import { FileBuilder } from './fileBuilder';
export interface ProjectFile { file_path: string; content: string; language?: string; }
class ZipExporter {
  async streamZip(files: ProjectFile[], res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', reject);
      archive.on('end', () => { logger.info(`ZIP: ${archive.pointer()} bytes`); resolve(); });
      archive.pipe(res);
      for (const file of files) archive.append(file.content || '', { name: file.file_path });
      archive.finalize();
    });
  }
  validate(files: ProjectFile[]): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = []; const errors: string[] = [];
    if (files.length === 0) { errors.push('No files to export'); return { valid: false, warnings, errors }; }
    const empty = files.filter(f => !f.content || f.content.trim().length === 0).map(f => f.file_path);
    if (empty.length) warnings.push(`Empty files: ${empty.join(', ')}`);
    return { valid: errors.length === 0, warnings, errors };
  }
  getStats(files: ProjectFile[]): { fileCount: number; totalBytes: number; byLanguage: Record<string, number>; largestFile: string } {
    const byLanguage: Record<string, number> = {}; let largestFile = ''; let largestSize = 0;
    for (const f of files) {
      const size = Buffer.byteLength(f.content || '', 'utf8');
      byLanguage[f.language || 'text'] = (byLanguage[f.language || 'text'] || 0) + 1;
      if (size > largestSize) { largestSize = size; largestFile = f.file_path; }
    }
    return { fileCount: files.length, totalBytes: files.reduce((a, f) => a + Buffer.byteLength(f.content || '', 'utf8'), 0), byLanguage, largestFile };
  }
}
export const zipExporter = new ZipExporter();
