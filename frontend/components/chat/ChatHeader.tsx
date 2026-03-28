'use client';

import { Keyboard } from 'lucide-react';
import { TTSControls } from './TTSControls';
import type { TTSVoice } from '@/hooks/useTTS';

interface ChatHeaderProps {
  ttsEnabled:      boolean;
  onTTSToggle:     () => void;
  voice:           TTSVoice;
  onVoice:         (v: TTSVoice) => void;
  isPlaying:       boolean;
  onStop:          () => void;
  onShowShortcuts?: () => void;
}

export function ChatHeader({
  ttsEnabled, onTTSToggle, voice, onVoice,
  isPlaying, onStop, onShowShortcuts,
}: ChatHeaderProps) {
  return (
    <div className="h-14 border-b border-[#E8E0D6] bg-white flex items-center justify-between px-5 shrink-0">
      <div>
        <p className="font-display text-sm font-bold text-[#1A1410]">ClaudGPT</p>
        <p className="text-[10px] text-[#A89585] hidden sm:block">
          Kimi K2 · GPT-OSS 120B · Llama 4 Scout · Orpheus TTS · Whisper STT
        </p>
      </div>

      <div className="flex items-center gap-2">
        <TTSControls
          enabled={ttsEnabled} onToggle={onTTSToggle}
          voice={voice} onVoice={onVoice}
          isPlaying={isPlaying} onStop={onStop}
        />

        {onShowShortcuts && (
          <button onClick={onShowShortcuts}
            className="p-2 rounded-xl hover:bg-[#F5F2EF] text-[#A89585] hover:text-[#6B5D52] transition hidden sm:flex"
            title="Keyboard shortcuts (?)">
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-[#A89585] font-medium hidden sm:inline">Live</span>
        </div>
      </div>
    </div>
  );
}
