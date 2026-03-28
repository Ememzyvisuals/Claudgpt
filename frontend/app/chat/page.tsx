'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ArtifactPanel } from '@/components/chat/ArtifactPanel';
import { MobileNav } from '@/components/shared/MobileNav';
import { ShortcutsModal } from '@/components/shared/ShortcutsModal';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useStream } from '@/hooks/useStream';
import { useTTS } from '@/hooks/useTTS';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { chatWithAttachments, type Attachment } from '@/lib/attachmentApi';
import { useChatStore } from '@/store/chatStore';
import { useArtifactStore } from '@/store/artifactStore';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeSessionId, createSession, loadSessions } = useChat();
  const { sendMessage, isStreaming, abort } = useStream();
  const { addMessage, editMessage, deleteFromMessage, clearMessages } = useChatStore();
  const { panelOpen, setPanelOpen } = useArtifactStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tts      = useTTS();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load messages when active session changes
  const { loadMessages } = useChat();
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // ── Keyboard shortcuts ────────────────────────────────────
  useKeyboardShortcuts({
    onNewChat:    async () => { await createSession('New Chat'); router.push('/chat'); },
    onClearChat:  ()      => { if (activeSessionId) clearMessages(activeSessionId); },
    onFocusInput: ()      => inputRef.current?.focus(),
    onTogglePanel:()      => setPanelOpen(!panelOpen),
  });

  // ── ? key for shortcuts modal ─────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === '?' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Get or create session ─────────────────────────────────
  const getSession = useCallback(async (message?: string): Promise<string> => {
    // Only return existing session — don't auto-create
    if (activeSessionId) return activeSessionId;
    // Only create a new session when the user actually sends a message
    if (!message) return '';
    const s = await createSession(message ? message.slice(0, 50) : 'New Chat');
    return s.id;
  }, [activeSessionId, createSession]);

  // ── Send plain text ───────────────────────────────────────
  const handleSend = useCallback(async (message: string) => {
    if (!message.trim()) return;
    const sid = await getSession(message);
    if (!sid) return; // guard — should not happen
    await sendMessage(sid, message);
  }, [getSession, sendMessage]);

  // ── Send with attachments / images ────────────────────────
  const handleSendWithAttachments = useCallback(async (
    message: string, files: Attachment[], images: Attachment[]
  ) => {
    const sid = await getSession(message);
    addMessage(sid, {
      id: `user-${Date.now()}`, role: 'user',
      content: message || `[${images.length > 0 ? 'Image' : 'File'} attached]`,
      createdAt: new Date().toISOString(),
    });
    try {
      const { response } = await chatWithAttachments(message, sid, files, images);
      addMessage(sid, {
        id: `asst-${Date.now()}`, role: 'assistant',
        content: response, createdAt: new Date().toISOString(),
      });
      if (tts.ttsEnabled) tts.speak(response);
    } catch (err) {
      addMessage(sid, {
        id: `err-${Date.now()}`, role: 'assistant', isError: true,
        content: `Error: ${err instanceof Error ? err.message : 'Failed to process.'}`,
        createdAt: new Date().toISOString(),
      });
    }
  }, [getSession, addMessage, tts]);

  // ── Edit user message + regenerate from that point ────────
  const handleEditMessage = useCallback(async (msgId: string, newContent: string) => {
    if (!activeSessionId) return;
    // Delete the edited message + everything after it
    deleteFromMessage(activeSessionId, msgId);
    // Re-send with new content — this regenerates the AI response
    await sendMessage(activeSessionId, newContent);
  }, [activeSessionId, deleteFromMessage, sendMessage]);

  // ── Regenerate last AI response ───────────────────────────
  const handleRegenerate = useCallback(async (msgId: string) => {
    if (!activeSessionId) return;
    const msgs = useChatStore.getState().messages[activeSessionId] || [];
    // Find the user message just before this AI message
    const aiIdx  = msgs.findIndex((m) => m.id === msgId);
    const userMsg = aiIdx > 0 ? msgs[aiIdx - 1] : null;
    if (!userMsg || userMsg.role !== 'user') return;
    // Delete from AI message onwards
    deleteFromMessage(activeSessionId, msgId);
    // Re-send user message
    await sendMessage(activeSessionId, userMsg.content);
  }, [activeSessionId, deleteFromMessage, sendMessage]);

  if (loading || !user) return <PageLoader />;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main chat column */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatHeader
          ttsEnabled={tts.ttsEnabled}
          onTTSToggle={() => tts.setTTSEnabled(!tts.ttsEnabled)}
          voice={tts.voice}
          onVoice={tts.setVoice}
          isPlaying={tts.isPlaying}
          onStop={tts.stop}
          onShowShortcuts={() => setShowShortcuts(true)}
        />

        <ChatWindow
            sessionId={activeSessionId}
            onSuggestion={handleSend}
            onSpeakMessage={tts.ttsEnabled ? tts.speak : undefined}
            onEditMessage={handleEditMessage}
            onRegenerate={handleRegenerate}
          />

        {/* Input — with bottom padding for mobile nav */}
        <div className="shrink-0 border-t border-[#E8E0D6] bg-white px-4 py-4 pb-safe-bottom md:pb-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSend}
              onSendWithAttachments={handleSendWithAttachments}
              onStop={abort}
              isStreaming={isStreaming}
              disabled={!ready}
              sessionId={activeSessionId || undefined}
            />
          </div>
        </div>
      </main>

      {/* Artifact Panel — right side ─────────────────────── */}
      <AnimatePresence>
        {panelOpen && <ArtifactPanel />}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Keyboard shortcuts modal */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
