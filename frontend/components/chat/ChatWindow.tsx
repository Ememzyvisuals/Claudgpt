'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { AgentStatusBar } from './AgentStatusBar';
import { Logo } from '@/components/shared/Logo';
import { useChatStore } from '@/store/chatStore';
import { useArtifactStore, extractArtifacts } from '@/store/artifactStore';

interface ChatWindowProps {
  sessionId?:      string | null;
  onSuggestion?:   (text: string) => void;
  onSpeakMessage?: (text: string, id: string) => void;
  onEditMessage?:  (messageId: string, newContent: string) => void;
  onRegenerate?:   (messageId: string) => void;
}

const SUGGESTIONS = [
  { label: 'Build a full-stack app',  prompt: 'Build a full-stack Next.js app with Supabase auth, TypeScript, and TailwindCSS' },
  { label: 'Create a WhatsApp bot',   prompt: 'Create a WhatsApp bot with Baileys — auto-replies, commands, and media support' },
  { label: 'Build a REST API',        prompt: 'Build a REST API with Express, TypeScript, Zod validation, and JWT auth' },
  { label: 'Debug my code',           prompt: 'Help me debug this code — paste your error below' },
  { label: 'Security review',         prompt: 'Review my code for OWASP security vulnerabilities and performance issues' },
  { label: 'Automation script',       prompt: 'Write a Node.js automation script to scrape data and save to a database' },
];

export function ChatWindow({
  sessionId, onSuggestion, onSpeakMessage, onEditMessage, onRegenerate,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming } = useChatStore();
  const { addArtifact }           = useArtifactStore();

  const sessionMessages = useMemo(
    () => (sessionId ? messages[sessionId] : []) || [],
    [messages, sessionId]
  );

  // Stable key to track when streaming completes — avoids expression in dep array
  const streamingKey = useMemo(
    () => sessionMessages.map((m) => `${m.id}:${m.isStreaming ? '1' : '0'}`).join('|'),
    [sessionMessages]
  );

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages.length, isStreaming]);

  // Extract artifacts when an AI message finishes streaming
  useEffect(() => {
    if (!sessionMessages.length) return;
    const lastMsg = sessionMessages[sessionMessages.length - 1];
    // Only extract when the last assistant message just finished streaming
    if (lastMsg.role !== 'assistant' || lastMsg.isStreaming) return;

    if (!sessionId) return;
    const arts = extractArtifacts(lastMsg.content, sessionId, lastMsg.id);
    for (const art of arts) {
      addArtifact(art);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingKey, sessionId]);

  if (sessionMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 overflow-y-auto bg-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-2xl"
        >
          <div className="flex justify-center mb-6">
            <Logo size="lg" showWordmark={false} />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1A1410] mb-3 tracking-tight">
            How can I help you build today?
          </h2>
          <p className="text-[#8B7B6B] text-sm mb-10 leading-relaxed max-w-md mx-auto">
            Write full projects, debug errors, review code — with image reading,
            file uploads, GitHub repos, and voice input.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => onSuggestion?.(s.prompt)}
                className="group text-left bg-[#FAFAF8] hover:bg-white border border-[#E8E0D6] hover:border-[#C4A484] rounded-2xl px-5 py-4 transition-all duration-200 hover:shadow-soft-md"
              >
                <p className="text-sm font-semibold text-[#1A1410] group-hover:text-[#8B5E3C] transition mb-1">
                  {s.label}
                </p>
                <p className="text-xs text-[#A89585] group-hover:text-[#8B7B6B] transition leading-snug line-clamp-2">
                  {s.prompt}
                </p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Voice input', 'Image upload', 'GitHub repos', 'File analysis', 'Live preview', 'Code export'].map((f) => (
              <span key={f} className="flex items-center gap-1.5 bg-[#FAFAF8] border border-[#E8E0D6] px-3 py-1 rounded-full text-[11px] text-[#A89585]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4A484] shrink-0" />
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white scroll-smooth">
      <div className="max-w-3xl mx-auto py-4 px-3">
        {sessionMessages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            sessionId={sessionId}
            isLast={idx === sessionMessages.length - 1}
            onRegenerate={
              msg.role === 'assistant' && idx === sessionMessages.length - 1
                ? () => onRegenerate?.(msg.id)
                : undefined
            }
            onEdit={msg.role === 'user' ? onEditMessage : undefined}
            onSpeak={onSpeakMessage}
          />
        ))}

        <AgentStatusBar isVisible={isStreaming} />
        <div ref={bottomRef} className="h-8" />
      </div>
    </div>
  );
}
