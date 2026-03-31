'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Square, Paperclip, Github, Zap, Code2, Bug, ChevronDown, Eye, ArrowUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AttachmentBar } from './AttachmentBar';
import { GitHubModal } from './GitHubModal';
import { MicButton, VoiceRecorder } from './VoiceRecorder';
import { processFile, chatWithAttachments, type Attachment } from '@/lib/attachmentApi';

interface ChatInputProps {
  onSend: (message: string, mode?: string) => void;
  onSendWithAttachments?: (message: string, files: Attachment[], images: Attachment[]) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  sessionId?: string;
}

const MODES = [
  { value: 'chat',   label: 'Chat',   icon: Zap,   desc: 'General conversation'  },
  { value: 'code',   label: 'Code',   icon: Code2, desc: 'Generate full projects' },
  { value: 'debug',  label: 'Debug',  icon: Bug,   desc: 'Fix bugs and errors'    },
  { value: 'agent',  label: 'Agent',  icon: Zap,   desc: 'Full agent pipeline'    },
  { value: 'review', label: 'Review', icon: Eye,   desc: 'Audit & review code'    },
];

const ACCEPTED = ',.ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.cpp,.sql,.sh,.yaml,.yml,.json,.md,image/*,text/*';

export function ChatInput({
  onSend, onSendWithAttachments, onStop,
  isStreaming, disabled, sessionId,
}: ChatInputProps) {
  const [value, setValue]               = useState('');
  const [mode,  setMode]                = useState('chat');
  const [showModes, setShowModes]       = useState(false);
  const [attachments, setAttachments]   = useState<Attachment[]>([]);
  const [showGitHub, setShowGitHub]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [webSearch, setWebSearch]       = useState(false);
  const [voiceMode, setVoiceMode]       = useState(false);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeMode   = MODES.find((m) => m.value === mode) || MODES[0];

  const resize = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`; }
  };

  const handleSend = useCallback(async () => {
    const msg = value.trim();
    if ((!msg && !attachments.length) || isStreaming || disabled) return;
    const images = attachments.filter((a) => a.type === 'image');
    const files  = attachments.filter((a) => a.type !== 'image');
    if ((images.length || files.length) && onSendWithAttachments) {
      onSendWithAttachments(msg, files, images);
    } else {
      onSend(msg, webSearch ? 'search' : mode);
    }
    setValue('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, mode, isStreaming, disabled, attachments, onSend, onSendWithAttachments]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const results: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 10 * 1024 * 1024) continue;
      try { results.push(await processFile(f)); } catch { /* skip */ }
    }
    setAttachments((p) => [...p, ...results]);
    setUploading(false);
  }, []);

  // ── Voice transcription handler ────────────────────────────
  // When Whisper returns text, put it in the textarea
  const handleTranscribed = useCallback((text: string) => {
    setValue(text);
    setVoiceMode(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      resize();
    }, 50);
  }, []);

  const hasAttachments = attachments.length > 0;
  const hasImages      = attachments.some((a) => a.type === 'image');
  const hasValue       = value.trim().length > 0;

  return (
    <>
      <GitHubModal
        isOpen={showGitHub}
        onClose={() => setShowGitHub(false)}
        onLoaded={(a) => setAttachments((p) => [...p, ...a as Attachment[]])}
      />

      <div
        className="relative"
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* ── Voice Recorder overlay (shown while recording / transcribing) ── */}
        {voiceMode && (
          <VoiceRecorder
            onTranscribed={handleTranscribed}
            onSend={(text) => { setValue(''); onSend(text, mode); }}
          />
        )}

        {/* ── Mode picker ── */}
        <AnimatePresence>
          {showModes && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 bg-white border border-[#E8E0D6] rounded-2xl overflow-hidden shadow-soft-lg z-30 w-52"
            >
              {MODES.map((m) => (
                <button key={m.value} onClick={() => { setMode(m.value); setShowModes(false); }}
                  className={cn('flex items-center gap-3 w-full px-4 py-3 text-sm transition hover:bg-[#FAFAF8]',
                    mode === m.value ? 'text-[#C4A484] bg-[#F5F2EF]' : 'text-[#6B5D52]')}>
                  <m.icon className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold leading-none">{m.label}</p>
                    <p className="text-[11px] text-[#A89585] mt-0.5">{m.desc}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main input box ── */}
        <div className={cn(
          'bg-white border-2 rounded-3xl transition-all shadow-soft-md',
          isStreaming
            ? 'border-[#C4A484]/60'
            : 'border-[#E8E0D6] focus-within:border-[#C4A484] focus-within:shadow-soft-lg'
        )}>

          {/* Attachment chips */}
          {hasAttachments && (
            <div className="px-4 pt-3.5">
              <AttachmentBar
                attachments={attachments}
                onRemove={(id) => setAttachments((p) => p.filter((a) => a.id !== id))}
              />
            </div>
          )}

          {/* Web search indicator */}
          {webSearch && (
            <div className="flex items-center gap-1.5 px-5 pt-2 pb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] text-blue-500 font-medium">
                Web search ON — using Groq Compound
              </span>
            </div>
          )}

          {/* Vision mode indicator */}
          {hasImages && (
            <div className="flex items-center gap-1.5 px-5 pt-2 pb-1">
              <div className="w-2 h-2 rounded-full bg-[#C4A484] animate-pulse" />
              <span className="text-[11px] text-[#C4A484] font-medium">
                Vision mode — Llama 4 Scout
              </span>
            </div>
          )}

          {/* ── Textarea row ── */}
          <div className="flex items-end gap-2 px-3 py-3">

            {/* Mode toggle */}
            <button
              onClick={() => setShowModes(!showModes)}
              className="flex items-center gap-1.5 text-xs text-[#8B7B6B] hover:text-[#1A1410] bg-[#F5F2EF] hover:bg-[#EDE8E2] border border-[#E8E0D6] px-3 py-2 rounded-xl transition shrink-0 mb-0.5 font-medium"
            >
              <activeMode.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeMode.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); resize(); }}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                const items = e.clipboardData.items;
                const imgs: File[] = [];
                for (const item of Array.from(items)) {
                  if (item.type.startsWith('image/')) { const f = item.getAsFile(); if (f) imgs.push(f); }
                }
                if (imgs.length) handleFiles(imgs);
              }}
              disabled={disabled || uploading}
              placeholder={
                uploading         ? 'Processing file...' :
                hasImages         ? 'Ask about the image...' :
                hasAttachments    ? 'Ask about the attached files...' :
                'Message ClaudGPT… (Shift+Enter for new line)'
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#1A1410] placeholder-[#A89585] resize-none outline-none min-h-[24px] max-h-[220px] py-1.5 leading-relaxed font-body"
            />

            {/* ── Action buttons ── */}

            {/* Attach file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              title="Attach file or image"
              className="p-2 text-[#A89585] hover:text-[#C4A484] hover:bg-[#F5F2EF] rounded-xl transition shrink-0 mb-0.5"
            >
              <Paperclip className={cn('w-4 h-4', uploading && 'animate-pulse text-[#C4A484]')} />
            </button>

            {/* GitHub */}
            <button
              onClick={() => setShowGitHub(true)}
              disabled={disabled}
              title="Load GitHub repository"
              className="p-2 text-[#A89585] hover:text-[#1A1410] hover:bg-[#F5F2EF] rounded-xl transition shrink-0 mb-0.5"
            >
              <Github className="w-4 h-4" />
            </button>

            {/* Web search toggle */}
            <button
              onClick={() => setWebSearch(!webSearch)}
              disabled={disabled}
              title={webSearch ? 'Web search ON — click to disable' : 'Enable web search (Groq Compound)'}
              className={cn(
                'p-2 rounded-xl transition shrink-0 mb-0.5',
                webSearch
                  ? 'text-blue-500 bg-blue-50 border border-blue-200'
                  : 'text-[#A89585] hover:text-[#1A1410] hover:bg-[#F5F2EF]'
              )}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* ── Mic button — opens voice recorder overlay ── */}
            {!voiceMode ? (
              <MicButton
                disabled={disabled || isStreaming}
                onTranscribed={handleTranscribed}
              />
            ) : null}

            {/* ── Send / Stop ── */}
            {isStreaming ? (
              <button
                onClick={onStop}
                className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-500 transition hover:bg-red-100 shrink-0"
                title="Stop generation"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <motion.button
                onClick={handleSend}
                disabled={(!hasValue && !attachments.length) || disabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'p-2.5 rounded-2xl text-white transition shrink-0',
                  (hasValue || hasAttachments)
                    ? 'bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] shadow-primary hover:shadow-primary-lg'
                    : 'bg-[#E8E0D6] cursor-not-allowed',
                )}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Hint bar */}
          <div className="flex items-center justify-between px-5 pb-3 pt-0">
            <p className="text-[10px] text-[#A89585]">
              Drop files · Paste images · <span className="text-[#C4A484] font-medium">Mic</span> for voice · Shift+Enter for new line
            </p>
            <p className="text-[10px] text-[#C4A484] font-medium hidden sm:block">
              ClaudGPT · EMEMZYVISUALS DIGITALS
            </p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </>
  );
}
