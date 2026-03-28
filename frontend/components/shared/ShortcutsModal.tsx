'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
  isOpen:   boolean;
  onClose:  () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white border border-[#E8E0D6] rounded-3xl p-6 w-full max-w-sm shadow-soft-lg"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F5F2EF] flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-[#C4A484]" />
                </div>
                <h3 className="font-display text-base font-bold text-[#1A1410]">Keyboard Shortcuts</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-[#F5F2EF] rounded-xl text-[#A89585] hover:text-[#6B5D52] transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {SHORTCUTS.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-[#6B5D52]">{label}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((key, i) => (
                      <span key={i} className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-[#F5F2EF] border border-[#E8E0D6] rounded-lg text-xs font-mono font-semibold text-[#8B7B6B] shadow-soft-sm">
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#A89585] text-center mt-5">
              Press <kbd className="px-1.5 py-0.5 bg-[#F5F2EF] border border-[#E8E0D6] rounded text-[10px] font-mono">?</kbd> to toggle this panel
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
