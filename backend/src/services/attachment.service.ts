import { logger } from '../utils/logger';

export interface ParsedAttachment {
  type: 'image' | 'text' | 'code' | 'pdf' | 'github';
  name: string;
  content: string;          // text content or base64 for images
  mimeType?: string;
  language?: string;
  size?: number;
}

const CODE_EXTENSIONS: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  py: 'python', go: 'go', rs: 'rust', java: 'java', cpp: 'cpp',
  c: 'c', cs: 'csharp', rb: 'ruby', php: 'php', swift: 'swift',
  kt: 'kotlin', r: 'r', sql: 'sql', sh: 'bash', yaml: 'yaml',
  yml: 'yaml', json: 'json', html: 'html', css: 'css', scss: 'scss',
  md: 'markdown', env: 'dotenv', toml: 'toml', xml: 'xml',
};

class AttachmentService {
  // ── Detect file type ────────────────────────────────────────
  detectType(filename: string, mimeType: string): ParsedAttachment['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (CODE_EXTENSIONS[ext]) return 'code';
    return 'text';
  }

  // ── Process a text/code file ────────────────────────────────
  processTextFile(filename: string, content: string, mimeType: string): ParsedAttachment {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const type = this.detectType(filename, mimeType);
    return {
      type,
      name: filename,
      content: content.slice(0, 100_000), // max 100K chars
      mimeType,
      language: CODE_EXTENSIONS[ext] || 'text',
      size: content.length,
    };
  }

  // ── Process an image file ───────────────────────────────────
  processImage(filename: string, base64: string, mimeType: string): ParsedAttachment {
    return {
      type: 'image',
      name: filename,
      content: base64,
      mimeType,
      size: Math.round(base64.length * 0.75),
    };
  }

  // ── Fetch and parse a GitHub repository ────────────────────
  async fetchGitHubRepo(repoUrl: string): Promise<ParsedAttachment[]> {
    try {
      // Parse: https://github.com/owner/repo or github.com/owner/repo
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
      if (!match) throw new Error('Invalid GitHub URL format');

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      logger.info(`Fetching GitHub repo: ${owner}/${cleanRepo}`);

      // Get repo metadata
      const metaRes = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepo}`,
        { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ClaudGPT' } }
      );
      if (!metaRes.ok) throw new Error(`GitHub API: ${metaRes.status} ${metaRes.statusText}`);
      const meta = await metaRes.json() as Record<string, unknown>;

      // Get file tree (recursive)
      const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/HEAD?recursive=1`,
        { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ClaudGPT' } }
      );
      if (!treeRes.ok) throw new Error(`GitHub tree: ${treeRes.status}`);
      const treeData = await treeRes.json() as { tree: Array<{ path: string; type: string; size?: number }> };

      // Filter to important files (skip binaries, node_modules, etc.)
      const importantFiles = treeData.tree
        .filter((f) =>
          f.type === 'blob' &&
          !f.path.includes('node_modules/') &&
          !f.path.includes('.git/') &&
          !f.path.includes('dist/') &&
          !f.path.includes('.next/') &&
          (f.size || 0) < 200_000 && // skip large files
          !f.path.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|zip|tar|gz)$/i)
        )
        .slice(0, 50); // max 50 files

      const attachments: ParsedAttachment[] = [];

      // Add repo summary
      attachments.push({
        type: 'github',
        name: `${owner}/${cleanRepo}`,
        content: `Repository: ${owner}/${cleanRepo}
Description: ${meta.description || 'No description'}
Language: ${meta.language || 'Unknown'}
Stars: ${meta.stargazers_count || 0}
Forks: ${meta.forks_count || 0}
Default branch: ${meta.default_branch || 'main'}
URL: ${repoUrl}

Files (${importantFiles.length} files loaded):
${importantFiles.map((f) => `- ${f.path} (${f.size ? Math.round(f.size / 1024) + 'KB' : '?'})`).join('\n')}`,
        mimeType: 'text/plain',
      });

      // Fetch up to 20 key files content
      const filesToFetch = importantFiles
        .filter((f) => {
          const ext = f.path.split('.').pop()?.toLowerCase() || '';
          return CODE_EXTENSIONS[ext] || f.path.match(/readme|package\.json|tsconfig|dockerfile/i);
        })
        .slice(0, 20);

      await Promise.allSettled(
        filesToFetch.map(async (file) => {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/HEAD/${file.path}`;
            const res = await fetch(rawUrl, { headers: { 'User-Agent': 'ClaudGPT' } });
            if (!res.ok) return;
            const content = await res.text();
            const ext = file.path.split('.').pop()?.toLowerCase() || '';
            attachments.push({
              type: 'code',
              name: file.path,
              content: content.slice(0, 20_000),
              language: CODE_EXTENSIONS[ext] || 'text',
              mimeType: 'text/plain',
              size: content.length,
            });
          } catch { /* skip failed files */ }
        })
      );

      logger.info(`GitHub repo loaded: ${attachments.length} items from ${owner}/${cleanRepo}`);
      return attachments;
    } catch (err) {
      logger.error('GitHub fetch error:', err);
      throw err;
    }
  }

  // ── Build context string from attachments ───────────────────
  buildAttachmentContext(attachments: ParsedAttachment[]): string {
    if (!attachments.length) return '';

    const parts: string[] = ['\n\n--- ATTACHED CONTEXT ---'];

    for (const att of attachments) {
      if (att.type === 'image') {
        parts.push(`[IMAGE: ${att.name}] — described in vision analysis above`);
      } else if (att.type === 'github') {
        parts.push(`\n## GitHub Repository: ${att.name}\n${att.content}`);
      } else {
        const lang = att.language && att.language !== 'text' ? att.language : '';
        parts.push(`\n## File: ${att.name}\n\`\`\`${lang}\n${att.content}\n\`\`\``);
      }
    }

    parts.push('--- END ATTACHED CONTEXT ---');
    return parts.join('\n');
  }
}

export const attachmentService = new AttachmentService();
