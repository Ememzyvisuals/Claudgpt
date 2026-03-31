'use client';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Download, Edit3, Save, X, FileCode, Maximize2, Minimize2 } from 'lucide-react';
import { cn, detectLanguage, formatBytes } from '@/lib/utils';
import type { ProjectFile } from '@/store/projectStore';
export function FileViewer({ file, onSave, readOnly = false }: { file: ProjectFile | null; onSave?: (path: string, content: string) => Promise<void>; readOnly?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const handleCopy = useCallback(async () => { if (!file) return; await navigator.clipboard.writeText(file.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }, [file]);
  const handleDownload = useCallback(() => { if (!file) return; const blob = new Blob([file.content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.filePath.split('/').pop() || 'file'; a.click(); URL.revokeObjectURL(url); }, [file]);
  const handleSave = async () => { if (!file || !onSave) return; setIsSaving(true); try { await onSave(file.filePath, editContent); setIsEditing(false); } finally { setIsSaving(false); } };
  if (!file) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d14] text-center px-8">
      <FileCode className="w-12 h-12 text-gray-700 mb-4" /><p className="text-gray-500 text-sm">Select a file to view its contents</p>
    </div>
  );
  const lines = file.content.split('\n');
  const lang = file.language || detectLanguage(file.filePath);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('flex flex-col bg-[#0d0d14]', expanded ? 'fixed inset-0 z-50' : 'flex-1')}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#111118] shrink-0">
        <span className="text-xs text-gray-300 font-mono truncate flex-1">{file.filePath}</span>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <span className="text-[10px] text-gray-600 px-2 font-mono">{lang}</span>
          <span className="text-[10px] text-gray-600 px-2">{formatBytes(new Blob([file.content]).size)}</span>
          <button onClick={handleCopy} className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-gray-300 transition">{copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}</button>
          <button onClick={handleDownload} className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-gray-300 transition"><Download className="w-3.5 h-3.5" /></button>
          {!readOnly && !isEditing && <button onClick={() => { setEditContent(file.content); setIsEditing(true); }} className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-gray-300 transition"><Edit3 className="w-3.5 h-3.5" /></button>}
          {isEditing && <><button onClick={handleSave} disabled={isSaving} className="text-xs bg-violet-600/20 border border-violet-500/30 text-violet-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1"><Save className="w-3 h-3" />{isSaving ? 'Saving...' : 'Save'}</button><button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-white/5 rounded text-gray-500 transition"><X className="w-3.5 h-3.5" /></button></>}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-gray-300 transition">{expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-full bg-transparent text-sm text-gray-200 font-mono leading-6 p-4 outline-none resize-none" spellCheck={false} autoFocus />
        ) : (
          <div className="flex min-h-full">
            <div className="select-none text-right pr-3 border-r border-white/5 shrink-0 w-12">
              {Array.from({ length: lines.length }, (_, i) => <div key={i} className="text-[11px] text-gray-600 leading-6">{i + 1}</div>)}
            </div>
            <pre className="flex-1 p-4 text-sm font-mono leading-6 text-gray-300 whitespace-pre !border-0 !bg-transparent !m-0 overflow-x-auto"><code>{file.content}</code></pre>
          </div>
        )}
      </div>
      <div className="border-t border-white/5 px-4 py-1.5 flex items-center justify-between bg-[#0d0d14] shrink-0">
        <span className="text-[10px] text-gray-600 font-mono">{lines.length} lines · {file.content.length} chars</span>
        <span className="text-[10px] text-gray-600">{lang} · UTF-8</span>
      </div>
    </motion.div>
  );
}
