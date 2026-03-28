'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useArtifactStore } from '@/store/artifactStore';

interface ShortcutHandlers {
  onNewChat:    () => void;
  onClearChat?: () => void;
  onFocusInput: () => void;
  onTogglePanel?: () => void;
}

export function useKeyboardShortcuts({
  onNewChat,
  onClearChat,
  onFocusInput,
  onTogglePanel,
}: ShortcutHandlers) {
  const router = useRouter();

  const handleKey = useCallback((e: KeyboardEvent) => {
    const meta = e.metaKey || e.ctrlKey;
    const key  = e.key.toLowerCase();

    // Skip if user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

    // ── Cmd/Ctrl + K → New chat ────────────────────────────
    if (meta && key === 'k' && !e.shiftKey) {
      e.preventDefault();
      onNewChat();
      return;
    }

    // ── Cmd/Ctrl + L → Clear / focus input ────────────────
    if (meta && key === 'l') {
      e.preventDefault();
      onClearChat?.();
      onFocusInput();
      return;
    }

    // ── Cmd/Ctrl + \ → Toggle artifact panel ──────────────
    if (meta && key === '\\') {
      e.preventDefault();
      onTogglePanel?.();
      return;
    }

    // ── Cmd/Ctrl + D → Dashboard ──────────────────────────
    if (meta && key === 'd' && !inInput) {
      e.preventDefault();
      router.push('/dashboard');
      return;
    }

    // ── Cmd/Ctrl + P → Projects ───────────────────────────
    if (meta && key === 'p' && !inInput) {
      e.preventDefault();
      router.push('/projects');
      return;
    }

    // ── / → Focus input (when not already in one) ─────────
    if (key === '/' && !inInput && !meta) {
      e.preventDefault();
      onFocusInput();
      return;
    }

    // ── Escape → Close panels / blur ──────────────────────
    if (key === 'escape' && !inInput) {
      onTogglePanel?.();
    }
  }, [onNewChat, onClearChat, onFocusInput, onTogglePanel, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}

// ── Keyboard shortcuts help modal data ───────────────────────
export const SHORTCUTS = [
  { keys: ['⌘', 'K'],   label: 'New chat'             },
  { keys: ['⌘', 'L'],   label: 'Clear & focus input'  },
  { keys: ['⌘', '\\'],  label: 'Toggle artifact panel'},
  { keys: ['⌘', 'D'],   label: 'Go to dashboard'      },
  { keys: ['⌘', 'P'],   label: 'Go to projects'       },
  { keys: ['/'],         label: 'Focus chat input'     },
  { keys: ['Shift', '↵'], label: 'New line in input'  },
  { keys: ['↵'],         label: 'Send message'         },
  { keys: ['Esc'],       label: 'Close panels'         },
];
