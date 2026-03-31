import { create } from 'zustand';

export interface Message {
  id:          string;
  role:        'user' | 'assistant' | 'system';
  content:     string;
  createdAt:   string;
  isStreaming?: boolean;
  isError?:    boolean;
}

export interface ChatSession {
  id:        string;
  title:     string;
  model:     string;
  mode:      string;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  sessions:         ChatSession[];
  activeSessionId:  string | null;
  messages:         Record<string, Message[]>;
  isStreaming:      boolean;
  streamingContent: string;

  setSessions:     (s: ChatSession[]) => void;
  addSession:      (s: ChatSession) => void;
  removeSession:   (id: string) => void;
  setActiveSession:(id: string | null) => void;
  setMessages:     (sid: string, msgs: Message[]) => void;
  addMessage:      (sid: string, msg: Message) => void;
  editMessage:     (sid: string, msgId: string, content: string) => void;
  deleteFromMessage:(sid: string, msgId: string) => void;  // delete this + all after
  updateStreamingMessage: (sid: string, chunk: string) => void;
  finalizeStreamingMessage:(sid: string) => void;
  setIsStreaming:  (v: boolean) => void;
  clearMessages:   (sid: string) => void;
  editSession:     (id: string, title: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [], activeSessionId: null, messages: {},
  isStreaming: false, streamingContent: '',

  setSessions:     (sessions) => set({ sessions }),
  addSession:      (session)  => set((s) => ({ sessions: [session, ...s.sessions] })),
  removeSession:   (id)       => set((s) => ({
    sessions: s.sessions.filter((x) => x.id !== id),
    activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
  })),
  setActiveSession:(id) => set({ activeSessionId: id }),
  setMessages:     (sid, msgs) => set((s) => ({ messages: { ...s.messages, [sid]: msgs } })),

  addMessage: (sid, msg) => set((s) => ({
    messages: { ...s.messages, [sid]: [...(s.messages[sid] || []), msg] },
  })),

  // Edit a specific message content
  editMessage: (sid, msgId, content) => set((s) => ({
    messages: {
      ...s.messages,
      [sid]: (s.messages[sid] || []).map((m) =>
        m.id === msgId ? { ...m, content } : m
      ),
    },
  })),

  // Delete a message and everything after it (for regenerate)
  deleteFromMessage: (sid, msgId) => set((s) => {
    const msgs  = s.messages[sid] || [];
    const index = msgs.findIndex((m) => m.id === msgId);
    if (index === -1) return {};
    return { messages: { ...s.messages, [sid]: msgs.slice(0, index) } };
  }),

  editSession: (id, title) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, title } : sess),
  })),

  clearMessages: (sid) => set((s) => ({
    messages: { ...s.messages, [sid]: [] },
  })),

  updateStreamingMessage: (sid, chunk) => {
    const newContent = get().streamingContent + chunk;
    set((s) => {
      const msgs = s.messages[sid] || [];
      const last = msgs[msgs.length - 1];
      if (last?.isStreaming) {
        return {
          streamingContent: newContent,
          messages: {
            ...s.messages,
            [sid]: msgs.map((m, i) =>
              i === msgs.length - 1 ? { ...m, content: newContent } : m
            ),
          },
        };
      }
      return {
        streamingContent: newContent,
        messages: {
          ...s.messages,
          [sid]: [...msgs, {
            id: `stream-${Date.now()}`, role: 'assistant' as const,
            content: newContent, createdAt: new Date().toISOString(), isStreaming: true,
          }],
        },
      };
    });
  },

  finalizeStreamingMessage: (sid) => set((s) => ({
    messages: {
      ...s.messages,
      [sid]: (s.messages[sid] || []).map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      ),
    },
    isStreaming: false,
    streamingContent: '',
  })),

  setIsStreaming: (v) => set({ isStreaming: v }),
}));
