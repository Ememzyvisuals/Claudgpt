'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Check, Download, Code2, Globe,
  FileText, Braces, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, RefreshCw, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useArtifactStore, type Artifact } from '@/store/artifactStore';

// ── Live HTML preview inside iframe ──────────────────────────
function HtmlPreview({ content }: { content: string }) {
  const [key, setKey] = useState(0);
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#E8E0D6] bg-[#FAFAF8] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-[#A89585] font-mono">preview</span>
        </div>
        <button onClick={() => setKey((k) => k + 1)}
          className="p-1.5 hover:bg-[#EDE8E2] rounded-lg text-[#A89585] hover:text-[#6B5D52] transition">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <iframe
        key={key}
        srcDoc={content}
        className="flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="HTML Preview"
      />
    </div>
  );
}

// ── Code viewer with line numbers ─────────────────────────────
function CodeViewer({ content, language }: { content: string; language: string }) {
  const lines = content.split('\n');
  return (
    <div className="flex-1 overflow-auto bg-[#1A1410]">
      <div className="flex min-h-full">
        <div className="select-none text-right pr-4 pt-4 border-r border-[#2d2420] shrink-0 w-12">
          {lines.map((_, i) => (
            <div key={i} className="text-[11px] text-[#4d3d30] leading-6 font-mono">{i + 1}</div>
          ))}
        </div>
        <pre className="flex-1 p-4 text-sm font-mono leading-6 text-[#e8ddd4] whitespace-pre overflow-x-auto">
          <code className={`language-${language}`}>{content}</code>
        </pre>
      </div>
    </div>
  );
}

// ── Artifact tab pill ─────────────────────────────────────────
function ArtifactTab({ artifact, active, onClick }: { artifact: Artifact; active: boolean; onClick: () => void }) {
  const icons: Record<string, React.ElementType> = {
    html: Globe, react: Play, code: Code2, json: Braces,
    markdown: FileText, svg: Globe,
  };
  const Icon = icons[artifact.type] || Code2;
  return (
    <button onClick={onClick}
      className={cn('flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0',
        active ? 'bg-[#EDE8E2] text-[#8B5E3C] border border-[#C4A484]' : 'text-[#8B7B6B] hover:text-[#1A1410] hover:bg-[#EDE8E2]')}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="max-w-[100px] truncate">{artifact.title}</span>
    </button>
  );
}

// ── Main Artifact Panel ───────────────────────────────────────
export function ArtifactPanel() {
  const {
    artifacts, activeArtifactId,
    setActive, setPanelOpen, getActive,
  } = useArtifactStore();

  const [view,      setView]      = useState<'code' | 'preview'>('code');
  const [copied,    setCopied]    = useState(false);
  const [maximised, setMaximised] = useState(false);

  const active = getActive();

  const handleCopy = useCallback(async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [active]);

  const handleDownload = useCallback(() => {
    if (!active) return;
    const extMap: Record<string, string> = {
      html: 'html', react: 'tsx', code: active.language || 'txt',
      json: 'json', markdown: 'md', svg: 'svg',
    };
    const ext  = extMap[active.type] || 'txt';
    const blob = new Blob([active.content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `artifact.${ext}`; a.click();
    URL.revokeObjectURL(url);
  }, [active]);

  const canPreview = active?.type === 'html' || active?.type === 'svg';

  if (artifacts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'flex flex-col bg-white border-l border-[#E8E0D6] overflow-hidden',
        maximised
          ? 'fixed inset-0 z-50'
          : 'w-[520px] shrink-0'
      )}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E0D6] bg-[#FAFAF8] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="w-4 h-4 text-[#C4A484] shrink-0" />
          <span className="font-display text-sm font-semibold text-[#1A1410] truncate">
            {active?.title || 'Artifact'}
          </span>
          <span className="text-[10px] text-[#A89585] bg-[#F5F2EF] border border-[#E8E0D6] px-2 py-0.5 rounded-full font-medium shrink-0">
            {active?.language || active?.type}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Code / Preview toggle */}
          {canPreview && (
            <div className="flex bg-[#F5F2EF] rounded-lg p-0.5 mr-1">
              <button onClick={() => setView('code')}
                className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition', view === 'code' ? 'bg-white text-[#1A1410] shadow-soft-sm' : 'text-[#8B7B6B]')}>
                Code
              </button>
              <button onClick={() => setView('preview')}
                className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition', view === 'preview' ? 'bg-white text-[#1A1410] shadow-soft-sm' : 'text-[#8B7B6B]')}>
                Preview
              </button>
            </div>
          )}

          <button onClick={handleCopy} className="p-1.5 hover:bg-[#EDE8E2] rounded-lg text-[#A89585] hover:text-[#6B5D52] transition" title="Copy">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDownload} className="p-1.5 hover:bg-[#EDE8E2] rounded-lg text-[#A89585] hover:text-[#6B5D52] transition" title="Download">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setMaximised(!maximised)} className="p-1.5 hover:bg-[#EDE8E2] rounded-lg text-[#A89585] hover:text-[#6B5D52] transition">
            {maximised ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setPanelOpen(false)} className="p-1.5 hover:bg-[#EDE8E2] rounded-lg text-[#A89585] hover:text-red-500 transition" title="Close panel">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Artifact tabs (if multiple) ─────────────────────── */}
      {artifacts.length > 1 && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#E8E0D6] bg-[#FAFAF8] overflow-x-auto shrink-0">
          {artifacts.slice(-8).map((a) => (
            <ArtifactTab key={a.id} artifact={a} active={a.id === activeArtifactId} onClick={() => setActive(a.id)} />
          ))}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {active ? (
          canPreview && view === 'preview' ? (
            <HtmlPreview content={active.content} />
          ) : (
            <CodeViewer content={active.content} language={active.language} />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#A89585] text-sm">
            Select an artifact to view
          </div>
        )}
      </div>
    </motion.div>
  );
}
