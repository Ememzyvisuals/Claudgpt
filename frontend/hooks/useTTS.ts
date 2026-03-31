'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type TTSVoice =
  'tara' | 'dan' | 'leo' | 'mia' | 'zac' | 'zoe' |
  'autumn' | 'diana' | 'hannah' | 'austin' | 'daniel' | 'troy';

export const VOICE_OPTIONS: { value: TTSVoice; label: string; gender: 'female' | 'male' }[] = [
  { value: 'tara',   label: 'Tara',   gender: 'female' },
  { value: 'hannah', label: 'Hannah', gender: 'female' },
  { value: 'diana',  label: 'Diana',  gender: 'female' },
  { value: 'autumn', label: 'Autumn', gender: 'female' },
  { value: 'mia',    label: 'Mia',    gender: 'female' },
  { value: 'zoe',    label: 'Zoe',    gender: 'female' },
  { value: 'dan',    label: 'Dan',    gender: 'male'   },
  { value: 'leo',    label: 'Leo',    gender: 'male'   },
  { value: 'austin', label: 'Austin', gender: 'male'   },
  { value: 'daniel', label: 'Daniel', gender: 'male'   },
  { value: 'troy',   label: 'Troy',   gender: 'male'   },
  { value: 'zac',    label: 'Zac',    gender: 'male'   },
];

export function useTTS() {
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [voice,       setVoice]       = useState<TTSVoice>('tara');
  const [ttsEnabled,  setTTSEnabled]  = useState(false);

  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const currentId = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  // Backend handles Orpheus 200-char limit by chunking automatically
  // We cap at 2000 chars here to limit request size (≈10 chunks max)
  const MAX_TTS_CHARS = 2000;

  const speak = useCallback(async (text: string, messageId?: string) => {
    text = text.slice(0, MAX_TTS_CHARS);
    if (!text.trim() || !ttsEnabled) return;
    if (messageId && currentId.current === messageId) {
      // Toggle off if same message
      audioRef.current?.pause();
      setIsPlaying(false);
      currentId.current = null;
      return;
    }

    // Stop any current audio
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsLoading(true);
    setError(null);
    currentId.current = messageId || null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`${API_URL}/api/tts/speak`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ text, voice }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'TTS failed');
      }

      const blob   = await res.blob();
      const url    = URL.createObjectURL(blob);
      const audio  = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        currentId.current = null;
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Audio playback failed');
      };

      setIsLoading(false);
      setIsPlaying(true);
      await audio.play();

    } catch (err) {
      setIsLoading(false);
      setIsPlaying(false);
      setError(err instanceof Error ? err.message : 'TTS error');
    }
  }, [voice, ttsEnabled]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    currentId.current = null;
  }, []);

  return {
    speak, stop,
    isPlaying, isLoading, error,
    voice, setVoice,
    ttsEnabled, setTTSEnabled,
    currentlyPlayingId: currentId.current,
  };
}
