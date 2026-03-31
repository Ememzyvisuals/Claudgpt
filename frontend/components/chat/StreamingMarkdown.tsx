'use client';

import { memo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ChevronDown, ChevronRight, Download, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useArtifactStore, extractArtifacts } from '@/store/artifactStore';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={handle}
      className="p-1.5 rounded-lg hover:bg-white/10 text-[#8B9EB3] hover:text-white transition"
      title="Copy">
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-400" />
        : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function DownloadBtn({ text, filename }: { text: string; filename: string }) {
  const handle = useCallback(() => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, [text, filename]);
  return (
    <button onClick={handle}
      className="p-1.5 rounded-lg hover:bg-white/10 text-[#8B9EB3] hover:text-white transition"
      title="Download">
      <Download className="w-3.5 h-3.5" />
    </button>
  );
}

interface CodeBlockProps {
  language?: string;
  filePath?: string;
  children?: React.ReactNode;
  sessionId?: string;
  messageId?: string;
}

function getCodeText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getCodeText).join('');
  if (node && typeof node === 'object' && 'props' in (node as object)) {
    const el = node as React.ReactElement;
    return getCodeText(el.props?.children);
  }
  return '';
}

// Language → display label
function getLangLabel(lang: string): string {
  const map: Record<string, string> = {
    typescript: 'TypeScript', javascript: 'JavaScript', tsx: 'TSX', jsx: 'JSX',
    python: 'Python', rust: 'Rust', go: 'Go', java: 'Java', cpp: 'C++',
    css: 'CSS', html: 'HTML', sql: 'SQL', bash: 'Shell', yaml: 'YAML',
    json: 'JSON', markdown: 'Markdown', text: 'Text',
  };
  return map[lang.toLowerCase()] || lang.toUpperCase() || 'CODE';
}

function PremiumCodeBlock({ language = '', filePath, children, sessionId, messageId }: CodeBlockProps) {
  const [collapsed,  setCollapsed]  = useState(false);
  const { addArtifact, setPanelOpen } = useArtifactStore();

  const codeText  = getCodeText(children);
  const lines     = codeText ? codeText.split('\n').length : 0;
  const isLong    = lines > 20;
  const langLabel = getLangLabel(language);
  const filename  = filePath ? filePath.split('/').pop() || filePath : `file.${language || 'txt'}`;

  const openAsArtifact = useCallback(() => {
    if (!sessionId || !messageId || !codeText) return;
    const type = language === 'html' ? 'html'
      : (language.includes('jsx') || language.includes('tsx')) ? 'react'
      : language === 'json' ? 'json' : 'code';
    addArtifact({
      id:        `art-${messageId}-${Date.now()}`,
      sessionId, messageId, type,
      title:     filePath || `${langLabel} Code`,
      content:   codeText,
      language,
      createdAt: new Date().toISOString(),
    });
    setPanelOpen(true);
  }, [language, langLabel, filePath, codeText, sessionId, messageId, addArtifact, setPanelOpen]);

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-lg">
      {/* macOS-style header — dark, professional */}
      <div className="flex items-center justify-between bg-[#1C1C1E] px-4 py-2.5">
        {/* Left — traffic lights + file info */}
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex flex-col">
            {filePath && (
              <span className="text-[11px] text-[#C4A484] font-mono leading-tight">{filePath}</span>
            )}
            <span className="text-[10px] text-[#6B7280] font-medium">{langLabel} · {lines} lines</span>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1">
          {isLong && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8B9EB3] hover:text-white transition"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed
                ? <ChevronRight className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <DownloadBtn text={codeText} filename={filename} />
          {sessionId && messageId && (
            <button
              onClick={openAsArtifact}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8B9EB3] hover:text-white transition"
              title="Open in panel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <CopyBtn text={codeText} />
        </div>
      </div>

      {/* Code body */}
      {!collapsed ? (
        <div className="bg-[#141414] overflow-x-auto">
          <pre className="!mt-0 !mb-0 !rounded-none !border-0 !bg-transparent px-5 py-4 text-sm leading-relaxed">
            <code className={language ? `language-${language}` : ''}>{children}</code>
          </pre>
        </div>
      ) : (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full bg-[#141414] px-5 py-3 text-xs text-[#6B7280] text-center hover:text-[#8B9EB3] transition"
        >
          {lines} lines — click to expand
        </button>
      )}
    </div>
  );
}

interface StreamingMarkdownProps {
  content:      string;
  isStreaming?: boolean;
  sessionId?:   string;
  messageId?:   string;
}

export const StreamingMarkdown = memo(function StreamingMarkdown({
  content, isStreaming, sessionId, messageId,
}: StreamingMarkdownProps) {
  const safeContent = typeof content === 'string' ? content : String(content || '');

  return (
    <div className={cn('prose-light text-sm', isStreaming && 'streaming-cursor')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[]}
        components={{
          pre({ children }) {
            const codeEl  = children as React.ReactElement;
            const cls     = codeEl?.props?.className || '';
            const lang    = typeof cls === 'string' ? cls.replace('language-', '') : '';

            // Extract file path from language string if present
            // e.g. className="language-typescript path/to/file.ts"
            const parts    = lang.split(' ');
            const language = parts[0] || '';
            const filePath = parts[1] || undefined;

            return (
              <PremiumCodeBlock
                language={language}
                filePath={filePath}
                sessionId={sessionId}
                messageId={messageId}
              >
                {codeEl?.props?.children}
              </PremiumCodeBlock>
            );
          },
          code({ className, children, ...props }) {
            const isBlock = !!(props as Record<string, unknown>).node &&
              ((props as Record<string, unknown>).node as { type?: string })?.type !== 'inlineCode';
            if (isBlock) return <code className={className}>{children}</code>;
            return (
              <code className="bg-[#F5F2EF] text-[#8B5E3C] px-1.5 py-0.5 rounded-md text-[0.82em] font-mono border border-[#E8E0D6]">
                {children}
              </code>
            );
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
});
