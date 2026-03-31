'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Play, FolderOpen, FileCode,
  FileText, File, ChevronRight, ChevronDown, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParsedFile {
  path:     string;
  content:  string;
  language: string;
  ext:      string;
}

// Parse fenced code blocks from markdown content
export function parseFilesFromMarkdown(markdown: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  // Match ```lang path/to/file\ncontent``` pattern
  const regex = /```(\w+)?\s+([\w.\-/\\]+\.\w+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const language = match[1] || 'text';
    const path     = match[2].trim();
    const content  = match[3];
    const ext      = path.split('.').pop() || 'txt';
    files.push({ path, content, language, ext });
  }
  // Also catch plain fenced blocks without path (treat as single file)
  if (files.length === 0) {
    const simpleRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let idx = 0;
    while ((match = simpleRegex.exec(markdown)) !== null) {
      const language = match[1] || 'text';
      const content  = match[2];
      const ext = language === 'typescript' ? 'ts'
        : language === 'javascript' ? 'js'
        : language === 'python' ? 'py'
        : language === 'html' ? 'html'
        : language === 'css' ? 'css'
        : language === 'json' ? 'json'
        : 'txt';
      files.push({ path: `file-${idx++}.${ext}`, content, language, ext });
    }
  }
  return files;
}

// Build folder tree from flat file list
function buildTree(files: ParsedFile[]) {
  const tree: Record<string, unknown> = {};
  files.forEach((f) => {
    const parts = f.path.split('/');
    let node = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        (node as Record<string, unknown>)[part] = f;
      } else {
        if (!(node as Record<string, unknown>)[part]) {
          (node as Record<string, unknown>)[part] = {};
        }
        node = (node as Record<string, unknown>)[part] as Record<string, unknown>;
      }
    });
  });
  return tree;
}

function getFileIcon(ext: string) {
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
    py: '🐍', html: '🌐', css: '🎨', json: '📋',
    md: '📝', sh: '⚡', sql: '🗄️', env: '🔑',
  };
  return icons[ext] || '📄';
}

function TreeNode({ name, node, onSelect, selectedPath }: {
  name: string;
  node: unknown;
  onSelect: (f: ParsedFile) => void;
  selectedPath: string;
}) {
  const [open, setOpen] = useState(true);
  const isFile = node && typeof node === 'object' && 'content' in (node as object);

  if (isFile) {
    const file = node as ParsedFile;
    return (
      <button
        onClick={() => onSelect(file)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-xs transition',
          selectedPath === file.path
            ? 'bg-[#C4A484]/20 text-[#C4A484]'
            : 'text-[#A0A0A0] hover:bg-white/5 hover:text-white'
        )}
      >
        <span className="text-sm">{getFileIcon(file.ext)}</span>
        <span className="truncate font-mono">{name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-[#6B6B6B] hover:text-white transition"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <FolderOpen className="w-3.5 h-3.5 text-[#C4A484]" />
        <span className="font-medium">{name}</span>
      </button>
      {open && (
        <div className="ml-3 border-l border-white/10 pl-2 space-y-0.5">
          {Object.entries(node as Record<string, unknown>).map(([k, v]) => (
            <TreeNode key={k} name={k} node={v} onSelect={onSelect} selectedPath={selectedPath} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CodeExportPanelProps {
  content:  string;   // full AI message content
  onClose?: () => void;
}

export function CodeExportPanel({ content, onClose }: CodeExportPanelProps) {
  const files = useMemo(() => parseFilesFromMarkdown(content), [content]);
  const [selected, setSelected]   = useState<ParsedFile | null>(files[0] || null);
  const [preview,  setPreview]    = useState(false);

  const tree = useMemo(() => buildTree(files), [files]);

  const downloadAll = useCallback(async () => {
    if (files.length === 0) return;
    const JSZip = (await import('jszip')).default;
    const zip   = new JSZip();
    files.forEach((f) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'claudgpt-project.zip'; a.click();
    URL.revokeObjectURL(url);
  }, [files]);

  const downloadSingle = useCallback(() => {
    if (!selected) return;
    const blob = new Blob([selected.content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = selected.path.split('/').pop() || 'file.txt'; a.click();
    URL.revokeObjectURL(url);
  }, [selected]);

  // Build HTML preview — for HTML files run in iframe, for others show prettily
  const previewSrc = useMemo(() => {
    if (!selected) return '';
    if (selected.ext === 'html') {
      return URL.createObjectURL(new Blob([selected.content], { type: 'text/html' }));
    }
    // For multi-file HTML+CSS+JS — combine them
    const htmlFile = files.find((f) => f.ext === 'html');
    const cssFiles = files.filter((f) => f.ext === 'css');
    const jsFiles  = files.filter((f) => f.ext === 'js' || f.ext === 'ts');
    if (htmlFile) {
      let html = htmlFile.content;
      if (cssFiles.length > 0) {
        const styleTag = `<style>${cssFiles.map((f) => f.content).join('\n')}</style>`;
        html = html.replace('</head>', `${styleTag}\n</head>`);
      }
      if (jsFiles.length > 0) {
        const scriptTag = `<script>\n${jsFiles.map((f) => f.content).join('\n')}\n</script>`;
        html = html.replace('</body>', `${scriptTag}\n</body>`);
      }
      return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    }
    return '';
  }, [selected, files]);

  if (files.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-2 bottom-2 md:inset-x-auto md:right-4 md:bottom-4 md:w-[800px] md:max-w-[calc(100vw-2rem)] bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
      style={{ maxHeight: 'calc(100vh - 8rem)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#141414]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-xs text-[#8B8B8B] font-medium ml-1">
            {files.length} file{files.length !== 1 ? 's' : ''} generated
          </span>
        </div>
        <div className="flex items-center gap-2">
          {previewSrc && (
            <button onClick={() => setPreview(!preview)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                preview ? 'bg-[#C4A484] text-[#1A1410]' : 'bg-white/10 text-white hover:bg-white/15')}>
              <Eye className="w-3.5 h-3.5" />
              {preview ? 'Code' : 'Preview'}
            </button>
          )}
          <button onClick={downloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C4A484] hover:bg-[#b8956f] text-[#1A1410] text-xs font-semibold transition">
            <Download className="w-3.5 h-3.5" />
            Download ZIP
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-white hover:bg-white/10 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex" style={{ height: 'min(60vh, 500px)' }}>
        {/* File tree */}
        <div className="w-48 shrink-0 bg-[#141414] border-r border-white/8 overflow-y-auto p-2 space-y-0.5">
          {Object.entries(tree).map(([k, v]) => (
            <TreeNode
              key={k} name={k} node={v}
              onSelect={setSelected}
              selectedPath={selected?.path || ''}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selected && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 bg-[#1A1A1A] shrink-0">
              <span className="text-xs text-[#8B8B8B] font-mono">{selected.path}</span>
              <button onClick={downloadSingle}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#8B8B8B] hover:text-white hover:bg-white/10 transition">
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          )}

          {preview && previewSrc ? (
            <iframe
              src={previewSrc}
              className="flex-1 w-full bg-white"
              sandbox="allow-scripts allow-same-origin"
              title="Preview"
            />
          ) : (
            <div className="flex-1 overflow-auto">
              <pre className="p-4 text-xs font-mono text-[#C4A484] leading-relaxed whitespace-pre-wrap break-words">
                {selected?.content || ''}
              </pre>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
