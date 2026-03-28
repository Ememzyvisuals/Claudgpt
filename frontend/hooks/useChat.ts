'use client';

import { useCallback } from 'react';
import { chatApi } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import type { ChatSession, Message } from '@/store/chatStore';

/** Supabase returns snake_case — map to camelCase for the store */
function mapSession(raw: Record<string, unknown>): ChatSession {
  return {
    id:        raw.id as string,
    title:     (raw.title as string) || 'New Chat',
    model:     (raw.model as string) || 'llama3-70b-8192',
    mode:      (raw.mode as string) || 'chat',
    createdAt: (raw.created_at || raw.createdAt) as string,
    updatedAt: (raw.updated_at || raw.updatedAt) as string,
  };
}

function mapMessage(raw: Record<string, unknown>): Message {
  return {
    id:        raw.id as string,
    role:      raw.role as 'user' | 'assistant' | 'system',
    content:   raw.content as string,
    createdAt: (raw.created_at || raw.createdAt) as string,
  };
}

export function useChat() {
  const {
    sessions, activeSessionId, messages,
    setSessions, addSession, removeSession,
    setActiveSession, setMessages,
  } = useChatStore();

  const loadSessions = useCallback(async () => {
    try {
      const { sessions } = await chatApi.getSessions();
      setSessions((sessions as Record<string, unknown>[]).map(mapSession));
    } catch (e) { console.error('loadSessions:', e); }
  }, [setSessions]);

  const createSession = useCallback(async (title?: string) => {
    const { session } = await chatApi.createSession(title);
    const s = mapSession(session as Record<string, unknown>);
    addSession(s);
    setActiveSession(s.id);
    return s;
  }, [addSession, setActiveSession]);

  const deleteSession = useCallback(async (id: string) => {
    await chatApi.deleteSession(id);
    removeSession(id);
  }, [removeSession]);

  const loadMessages = useCallback(async (sid: string) => {
    try {
      const { messages } = await chatApi.getMessages(sid);
      setMessages(sid, (messages as Record<string, unknown>[]).map(mapMessage));
    } catch (e) { console.error('loadMessages:', e); }
  }, [setMessages]);

  const switchSession = useCallback(async (sid: string) => {
    setActiveSession(sid);
    await loadMessages(sid);
  }, [setActiveSession, loadMessages]);

  const activeMessages = activeSessionId ? (messages[activeSessionId] || []) : [];

  return {
    sessions, activeSessionId, activeMessages,
    loadSessions, createSession, deleteSession,
    loadMessages, switchSession,
  };
}
