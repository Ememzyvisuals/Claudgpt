import { supabaseService } from './supabase.service';
import { logger } from '../utils/logger';
export interface ParsedFile { path: string; content: string; language: string; }
const LANGUAGE_MAP: Record<string, string> = { ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown', sql: 'sql', sh: 'bash', yml: 'yaml' };
class ProjectService {
  detectLanguage(filePath: string): string { return LANGUAGE_MAP[filePath.split('.').pop()?.toLowerCase() || ''] || 'text'; }
  parseGeneratedFiles(rawOutput: string): ParsedFile[] {
    const files: ParsedFile[] = [];
    // Support both new fenced format and legacy FILE START/END
    const fencedRegex = /```(?:[\w]+)?\s+([\w.\/\-]+)\n([\s\S]*?)```/g;
    const legacyRegex = /---\s*FILE START\s*---\s*\npath:\s*(.+?)\s*\ncontent:\s*\n([\s\S]*?)---\s*FILE END\s*---/gi;
    const regex = fencedRegex;
    let match;
    while ((match = regex.exec(rawOutput)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, '').trim();
      files.push({ path: filePath, content, language: this.detectLanguage(filePath) });
    }
    logger.debug(`Parsed ${files.length} files`);
    return files;
  }
  async saveGeneratedFiles(projectId: string, files: ParsedFile[]): Promise<void> {
    for (const file of files) await supabaseService.saveProjectFile(projectId, file.path, file.content, file.language);
    logger.info(`Saved ${files.length} files to project ${projectId}`);
  }
}
export const projectService = new ProjectService();
