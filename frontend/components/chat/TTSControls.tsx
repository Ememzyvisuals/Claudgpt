'use client';

import { Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VOICE_OPTIONS, type TTSVoice } from '@/hooks/useTTS';

interface TTSControlsProps {
  enabled: boolean; onToggle: () => void;
  voice: TTSVoice; onVoice: (v: TTSVoice) => void;
  isPlaying: boolean; onStop: () => void;
}

export function TTSControls({ enabled, onToggle, voice, onVoice, isPlaying, onStop }: TTSControlsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const current = VOICE_OPTIONS.find((v) => v.value === voice) || VOICE_OPTIONS[0];

  return (
    <div className="relative flex items-center gap-1.5">
      <button onClick={onToggle}
        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
          enabled ? 'bg-[#EDE8E2] border border-[#C4A484] text-[#8B5E3C]' : 'bg-[#F5F2EF] border border-[#E8E0D6] text-[#8B7B6B] hover:text-[#1A1410]')}
        title={enabled ? 'Disable voice' : 'Enable Orpheus TTS'}>
        {enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{isPlaying ? 'Speaking...' : enabled ? 'Voice' : 'Voice'}</span>
      </button>

      {isPlaying && (
        <button onClick={onStop} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition">Stop</button>
      )}

      {enabled && (
        <button onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F5F2EF] border border-[#E8E0D6] text-[#8B7B6B] hover:text-[#1A1410] transition">
          {current.label}<ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      )}

      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 bg-white border border-[#E8E0D6] rounded-2xl overflow-hidden shadow-soft-lg z-40 w-52">
            <div className="px-4 py-2.5 border-b border-[#E8E0D6]">
              <p className="text-[10px] font-semibold text-[#A89585] uppercase tracking-wider">Orpheus Voice</p>
            </div>
            <div className="px-2 py-2 max-h-64 overflow-y-auto">
              {['female','male'].map((gender) => (
                <div key={gender}>
                  <p className="text-[10px] text-[#A89585] px-2 py-1 uppercase tracking-wider font-medium">{gender}</p>
                  {VOICE_OPTIONS.filter((v) => v.gender === gender).map((v) => (
                    <button key={v.value} onClick={() => { onVoice(v.value); setShowPicker(false); }}
                      className={cn('flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition',
                        voice === v.value ? 'bg-[#EDE8E2] text-[#8B5E3C] font-semibold' : 'text-[#6B5D52] hover:bg-[#FAFAF8] hover:text-[#1A1410]')}>
                      {v.label}
                      {voice === v.value && <span className="ml-auto text-[10px] text-[#C4A484]">Active</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-[#E8E0D6] bg-[#FAFAF8]">
              <p className="text-[10px] text-[#A89585] leading-snug">
                Powered by <span className="text-[#C4A484] font-medium">Canopy Labs Orpheus</span> via Groq.
                First accept terms in{' '}
                <a href="https://console.groq.com/playground?model=canopylabs/orpheus-v1-english" target="_blank" rel="noopener noreferrer" className="text-[#C4A484] underline">Groq Playground</a>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
