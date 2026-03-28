'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  /** Called with the transcribed text — populate the input field */
  onTranscribed: (text: string) => void;
  /** Called when user confirms send (tap the up-arrow after transcription) */
  onSend: (text: string) => void;
  className?: string;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceRecorder({ onTranscribed, onSend, className }: VoiceRecorderProps) {
  const transcribedRef = useRef('');

  const {
    state, duration, amplitude, error,
    isRecording, isTranscribing,
    startRecording, stopRecording, cancel,
  } = useVoiceRecorder({
    onTranscribed: (text) => {
      transcribedRef.current = text;
      onTranscribed(text);   // fill the textarea
    },
    onError: (msg) => console.warn('Voice error:', msg),
  });

  const isIdle = state === 'idle' || state === 'error';

  // ── Idle mic button ──────────────────────────────────────
  if (isIdle) {
    return (
      <button
        onClick={startRecording}
        className={cn(
          'p-2 rounded-xl transition-all duration-200 group',
          'text-[#A89585] hover:text-[#C4A484] hover:bg-[#F5F2EF]',
          'focus:outline-none',
          className
        )}
        title="Record voice message (Whisper STT)"
      >
        <Mic className="w-4 h-4 transition group-hover:scale-110" />
      </button>
    );
  }

  // ── Active recording / transcribing overlay ──────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-[#C4A484]/40 rounded-3xl shadow-soft-lg overflow-hidden z-40"
      >
        {/* ── Recording state ── */}
        {isRecording && (
          <div className="px-5 py-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-[#1A1410]">Recording</span>
                <span className="text-sm font-mono text-[#8B7B6B] tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
              <button onClick={cancel} className="p-1.5 rounded-xl hover:bg-[#F5F2EF] text-[#A89585] hover:text-[#6B5D52] transition" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Waveform bars */}
            <div className="flex items-center justify-center gap-[3px] h-12 mb-4">
              {amplitude.map((amp, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${Math.max(6, amp * 0.48)}px` }}
                  transition={{ duration: 0.08, ease: 'easeOut' }}
                  className="w-[3px] rounded-full"
                  style={{
                    background: amp > 40
                      ? '#C4A484'
                      : amp > 15
                      ? '#dcc9b0'
                      : '#E8E0D6',
                  }}
                />
              ))}
            </div>

            {/* Stop + send hint */}
            <div className="flex items-center gap-3">
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] text-white font-semibold text-sm shadow-primary hover:shadow-primary-lg transition-all hover:-translate-y-0.5"
              >
                <MicOff className="w-4 h-4" />
                Stop &amp; Transcribe
              </button>
            </div>

            <p className="text-center text-[10px] text-[#A89585] mt-3">
              Powered by Whisper Large V3 Turbo · 216× real-time
            </p>
          </div>
        )}

        {/* ── Transcribing state ── */}
        {isTranscribing && (
          <div className="px-5 py-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#F5F2EF] border border-[#E8E0D6] flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#C4A484] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1A1410] mb-1">Transcribing your voice…</p>
              <p className="text-xs text-[#A89585]">Whisper Large V3 Turbo is processing at 216× real-time</p>
            </div>
            {/* Animated dots */}
            <div className="flex gap-1.5">
              {[0,1,2].map((i) => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-[#C4A484]"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {state === 'error' && (
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <MicOff className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-600">Recording failed</p>
              <p className="text-xs text-[#A89585] truncate">{error}</p>
            </div>
            <button onClick={cancel} className="p-1.5 hover:bg-red-50 rounded-xl transition">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Inline mic button variant for inside the ChatInput ────────
// Shows just the mic icon when idle — used directly inside textarea row
export function MicButton({
  onTranscribed,
  disabled,
}: {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}) {
  const { isRecording, isTranscribing, startRecording, stopRecording, cancel, state } = useVoiceRecorder({
    onTranscribed,
  });

  if (isTranscribing) {
    return (
      <button disabled className="p-2 rounded-xl text-[#C4A484] shrink-0 mb-0.5">
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  if (isRecording) {
    return (
      <button
        onClick={stopRecording}
        className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition animate-pulse shrink-0 mb-0.5"
        title="Stop recording"
      >
        <MicOff className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="p-2 rounded-xl text-[#A89585] hover:text-[#C4A484] hover:bg-[#F5F2EF] transition shrink-0 mb-0.5 disabled:opacity-40"
      title="Record voice message — transcribed by Whisper"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
