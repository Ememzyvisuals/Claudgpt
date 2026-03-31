'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function AgentStatusBar({ isVisible, activeAgent }: { isVisible: boolean; activeAgent?: string | null }) {
  const AGENTS: Record<string, string> = {
    planner: 'Planning your project...', architect: 'Designing architecture...',
    coder: 'Writing code...', debugger: 'Debugging...', reviewer: 'Reviewing code...',
    search: 'Searching...', memory: 'Updating memory...', tool: 'Using tools...', export: 'Packaging...',
  };
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
          className="flex items-center gap-2.5 px-4 py-2.5 mx-4 my-1 bg-[#FAFAF8] border border-[#E8E0D6] rounded-2xl">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4A484] shrink-0" />
          <span className="text-xs text-[#8B7B6B] font-medium">
            {activeAgent ? (AGENTS[activeAgent] || 'Working...') : 'ClaudGPT is thinking...'}
          </span>
          <div className="ml-auto flex gap-1">
            {[0,1,2].map((i) => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C4A484]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
