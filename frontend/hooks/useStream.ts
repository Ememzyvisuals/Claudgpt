'use client';

import { useCallback, useRef, useState } from 'react';
import { streamChat, chatApi } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const abortRef                      = useRef(false);

  const {
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    setIsStreaming: setStoreStreaming,
    editSession,
    sessions,
  } = useChatStore();

  const sendMessage = useCallback(async (sessionId: string, content: string) => {
    // Allow sending even if previous stream was aborted/stuck — reset state first
    if (isStreaming) {
      setIsStreaming(false);
      setStoreStreaming(false);
    }
    setError(null);
    setIsStreaming(true);
    setStoreStreaming(true);
    abortRef.current = false;

    // Show user message immediately
    addMessage(sessionId, {
      id:        `user-${Date.now()}`,
      role:      'user',
      content,
      createdAt: new Date().toISOString(),
    });

    try {
      await streamChat(
        sessionId,
        content,
        (chunk) => {
          if (!abortRef.current) updateStreamingMessage(sessionId, chunk);
        },
        () => {
          finalizeStreamingMessage(sessionId);
          setIsStreaming(false);
          setStoreStreaming(false);
        },
        (err) => {
          setError(err);
          finalizeStreamingMessage(sessionId);
          setIsStreaming(false);
          setStoreStreaming(false);
        },
        (title) => {
          // Real AI-generated title from backend
          editSession(sessionId, title);
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Stream failed';
      setError(msg);
      finalizeStreamingMessage(sessionId);
      setIsStreaming(false);
      setStoreStreaming(false);
    }
  }, [isStreaming, addMessage, updateStreamingMessage, finalizeStreamingMessage, setStoreStreaming]);

  const abort = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    setStoreStreaming(false);
  }, [setStoreStreaming]);

  return { sendMessage, isStreaming, error, abort };
}
