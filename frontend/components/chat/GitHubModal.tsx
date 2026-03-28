'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, X, Loader2, Check, AlertCircle, Download, FileCode, FolderOpen, ChevronRight } from 'lucide-react';
import { fetchGitHubRepo, type Attachment } from '@/lib/attachmentApi';
import { cn } from '@/lib/utils';

interface GitHubModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onLoaded: (attachments: Attachment[]) => void;
}

interface RepoFile {
  path:    string;
  content: string;
  lang:    string;
  size:    number;
}

export function GitHubModal({ isOpen, onClose, onLoaded }: GitHubModalProps) {
  const [url,          setUrl]          = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [files,        setFiles]        = useState<RepoFile[]>([]);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [repoName,     setRepoName]     = useState('');
  const [step,         setStep]         = useState<'input' | 'select'>('input');

  const handleLoad = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { attachments, fileCount } = await fetchGitHubRepo(url.trim());
      const repoFiles: RepoFile[] = (attachments as Attachment[]).map((a) => ({
        path:    a.name,
        content: a.content || '',
        lang:    a.language || 'text',
        size:    (a.content || '').length,
      }));
      // Extract repo name from URL
      const parts = url.trim().split('/');
      setRepoName(parts[parts.length - 1] || 'repository');
      setFiles(repoFiles);
      // Pre-select all files
      setSelected(new Set(repoFiles.map((f) => f.path)));
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSelected = () => {
    const chosen = files.filter((f) => selected.has(f.path));
    if (!chosen.length) return;
    const attachments: Attachment[] = chosen.map((f) => ({
      id:       `gh-${f.path}`,
      type:     'file' as const,
      name:     f.path,
      content:  f.content,
      language: f.lang,
      size:     f.size,
    }));
    onLoaded(attachments);
    onClose();
    reset();
  };

  const handleDownloadZip = () => {
    // Build a simple text bundle for download
    const chosen = files.filter((f) => selected.has(f.path));
    const content = chosen.map((f) =>
      `// ═══ ${f.path} ═══\n${f.content}`
    ).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${repoName}-selected.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggleFile = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const reset = () => {
    setUrl(''); setError(''); setFiles([]);
    setSelected(new Set()); setRepoName(''); setStep('input');
  };

  const handleClose = () => { onClose(); reset(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white border border-[#E8E0D6] rounded-2xl w-full max-w-lg shadow-soft-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E8E0D6]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1A1410] flex items-center justify-center">
                  <Github className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1410]">
                    {step === 'input' ? 'Load GitHub Repository' : `${repoName} — Select Files`}
                  </h3>
                  <p className="text-[11px] text-[#A89585]">
                    {step === 'input'
                      ? 'Public repositories only'
                      : `${selected.size} of ${files.length} files selected`
                    }
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 hover:bg-[#F5F2EF] rounded-lg text-[#A89585] hover:text-[#1A1410] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === 'input' ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#6B5D52] block mb-1.5 uppercase tracking-wider">
                    Repository URL
                  </label>
                  <input
                    autoFocus value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
                    placeholder="https://github.com/owner/repository"
                    className="w-full bg-[#FAFAF8] border border-[#E8E0D6] rounded-xl px-4 py-3 text-sm text-[#1A1410] placeholder-[#A89585] focus:outline-none focus:border-[#C4A484] transition font-mono"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <div className="bg-[#FAFAF8] border border-[#E8E0D6] rounded-xl px-4 py-3">
                  <p className="text-[11px] text-[#8B7B6B] leading-relaxed">
                    ClaudGPT fetches up to <strong>20 source files</strong> and the full file tree.
                    On the next step you can choose which files to chat with or download them all.
                  </p>
                </div>

                <button
                  onClick={handleLoad}
                  disabled={!url.trim() || loading}
                  className="btn-primary w-full py-3 disabled:opacity-40"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading repository...</>
                    : <><Github className="w-4 h-4" /> Load Repository</>
                  }
                </button>
              </div>
            ) : (
              <div className="flex flex-col" style={{ maxHeight: '60vh' }}>
                {/* Select all */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E0D6]">
                  <button
                    onClick={() => setSelected(new Set(files.map(f => f.path)))}
                    className="text-xs text-[#C4A484] font-semibold hover:text-[#a8896a] transition"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-xs text-[#A89585] hover:text-[#1A1410] transition"
                  >
                    Deselect all
                  </button>
                </div>

                {/* File list */}
                <div className="overflow-y-auto flex-1 px-2 py-2">
                  {files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => toggleFile(file.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                        selected.has(file.path)
                          ? 'bg-[#F5F2EF] text-[#1A1410]'
                          : 'text-[#8B7B6B] hover:bg-[#FAFAF8]'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition',
                        selected.has(file.path) ? 'bg-[#C4A484] border-[#C4A484]' : 'border-[#E8E0D6]'
                      )}>
                        {selected.has(file.path) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-[#C4A484]" />
                      <span className="text-xs font-mono truncate flex-1">{file.path}</span>
                      <span className="text-[10px] text-[#A89585] shrink-0">
                        {file.size > 1024 ? `${(file.size/1024).toFixed(1)}kb` : `${file.size}b`}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-[#E8E0D6] flex gap-2">
                  <button
                    onClick={handleDownloadZip}
                    disabled={selected.size === 0}
                    className="btn-ghost flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handleSendSelected}
                    disabled={selected.size === 0}
                    className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Chat with {selected.size} file{selected.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
