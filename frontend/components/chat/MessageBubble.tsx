'use client';

import { useState, memo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, Sparkles, User, RefreshCw,
  ThumbsUp, ThumbsDown, Volume2, Edit3,
  Check as CheckIcon, X
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { StreamingMarkdown } from './StreamingMarkdown';
import type { Message } from '@/store/chatStore';

interface MessageBubbleProps {
  message:       Message;
  sessionId?:    string;
  onRegenerate?: () => void;
  onEdit?:       (messageId: string, newContent: string) => void;
  onSpeak?:      (text: string, id: string) => void;
  isLast?:       boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message, sessionId, onRegenerate, onEdit, onSpeak, isLast,
}: MessageBubbleProps) {
  const isUser     = message.role === 'user';
  const [liked,    setLiked]    = useState<boolean | null>(null);
  const [copying,  setCopying]  = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  }, [message.content]);

  const handleEditStart = useCallback(() => {
    setEditText(message.content);
    setEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 50);
  }, [message.content]);

  const handleEditSave = useCallback(() => {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(message.id, editText.trim());
    }
    setEditing(false);
  }, [editText, message.content, message.id, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditText(message.content);
    setEditing(false);
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'group relative px-4 py-3.5 rounded-2xl transition-colors hover:bg-[#FAFAF8]',
        isUser ? 'flex flex-row-reverse gap-3' : 'flex flex-row gap-3'
      )}
    >
      {/* ── Avatar ── */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-2',
        isUser
          ? 'bg-[#F5F2EF] ring-[#E8E0D6]'
          : 'bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] ring-[#C4A484]/20'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-[#8B7B6B]" />
          : <Sparkles className="w-4 h-4 text-white" />
        }
      </div>

      {/* ── Content ── */}
      <div className={cn('flex-1 min-w-0', isUser && 'flex flex-col items-end')}>

        {/* Label + time */}
        <div className={cn('flex items-center gap-2 mb-1.5', isUser && 'flex-row-reverse')}>
          <span className="text-xs font-semibold text-[#1A1410]">
            {isUser ? 'You' : 'ClaudGPT'}
          </span>
          <span className="text-[10px] text-[#A89585]">{formatDate(message.createdAt)}</span>
        </div>

        {/* User message — with inline edit */}
        {isUser ? (
          editing ? (
            <div className="w-full max-w-[80%]">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                  if (e.key === 'Escape') handleEditCancel();
                }}
                className="w-full bg-white border-2 border-[#C4A484] rounded-2xl rounded-tr-lg px-4 py-3 text-sm text-[#1A1410] resize-none outline-none min-h-[60px] max-h-[200px] font-body leading-relaxed shadow-soft-sm"
                rows={3}
              />
              <div className="flex items-center gap-2 mt-2 justify-end">
                <button onClick={handleEditCancel} className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#8B7B6B] hover:text-[#1A1410] bg-[#F5F2EF] border border-[#E8E0D6] rounded-xl transition font-medium">
                  <X className="w-3 h-3" /> Cancel
                </button>
                <button onClick={handleEditSave} className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] rounded-xl transition font-medium shadow-primary">
                  <CheckIcon className="w-3 h-3" /> Send edit
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1A1410] text-white rounded-3xl rounded-tr-lg px-5 py-3 text-sm leading-relaxed max-w-[80%] shadow-soft-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )
        ) : (
          /* AI response — streaming markdown */
          <div className="w-full">
            <StreamingMarkdown
              content={message.content}
              isStreaming={message.isStreaming}
              sessionId={sessionId}
              messageId={message.id}
            />
          </div>
        )}

        {/* ── Action bar ── */}
        <AnimatePresence>
          {!editing && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className={cn(
                'flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity',
                isUser && 'justify-end'
              )}
            >
              {/* Copy */}
              <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-[#EDE8E2] text-[#A89585] hover:text-[#6B5D52] transition" title="Copy">
                {copying ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Edit (user only) */}
              {isUser && onEdit && (
                <button onClick={handleEditStart} className="p-1.5 rounded-lg hover:bg-[#EDE8E2] text-[#A89585] hover:text-[#6B5D52] transition" title="Edit message">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* TTS speak (AI only) */}
              {!isUser && onSpeak && !message.isStreaming && (
                <button onClick={() => onSpeak(message.content, message.id)} className="p-1.5 rounded-lg hover:bg-[#EDE8E2] text-[#A89585] hover:text-[#C4A484] transition" title="Read aloud">
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Regenerate (AI only, last message) */}
              {!isUser && isLast && onRegenerate && !message.isStreaming && (
                <button onClick={onRegenerate} className="p-1.5 rounded-lg hover:bg-[#EDE8E2] text-[#A89585] hover:text-[#6B5D52] transition" title="Regenerate response">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              {!isUser && !message.isStreaming && (
                <>
                  <div className="w-px h-3.5 bg-[#E8E0D6] mx-0.5" />
                  <button onClick={() => setLiked(true)} className={cn('p-1.5 rounded-lg transition', liked === true ? 'text-green-500' : 'text-[#A89585] hover:bg-[#EDE8E2] hover:text-[#6B5D52]')}>
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setLiked(false)} className={cn('p-1.5 rounded-lg transition', liked === false ? 'text-red-500' : 'text-[#A89585] hover:bg-[#EDE8E2] hover:text-[#6B5D52]')}>
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
