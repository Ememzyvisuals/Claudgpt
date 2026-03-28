import { logger } from './logger';
export interface FileBlock { path: string; content: string; language: string; }
const LANGUAGE_MAP: Record<string, string> = { ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown', sql: 'sql', sh: 'bash', yml: 'yaml', yaml: 'yaml', env: 'dotenv' };
export class FileBuilder {
  static detectLanguage(filePath: string): string { return LANGUAGE_MAP[filePath.split('.').pop()?.toLowerCase() || ''] || 'text'; }
  static parse(rawOutput: string): FileBlock[] {
    const blocks: FileBlock[] = [];
    // Support both new fenced format and legacy FILE START/END
    const fencedRegex = /```(?:[\w]+)?\s+([\w.\/\-]+)\n([\s\S]*?)```/g;
    const legacyRegex = /---\s*FILE START\s*---\s*\npath:\s*(.+?)\s*\ncontent:\s*\n([\s\S]*?)---\s*FILE END\s*---/gi;
    const regex = fencedRegex;
    let match;
    while ((match = regex.exec(rawOutput)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].replace(/^```[\w-]*\n/, '').replace(/\n```\s*$/, '').trim();
      blocks.push({ path: filePath, content, language: FileBuilder.detectLanguage(filePath) });
    }
    logger.debug(`FileBuilder parsed ${blocks.length} blocks`);
    return blocks;
  }
  static validate(file: FileBlock): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    if (!file.content || file.content.trim().length === 0) return { valid: false, warnings: ['File is empty'] };
    if (file.content.includes('// ... rest of code')) warnings.push('File appears truncated');
    return { valid: true, warnings };
  }
}
