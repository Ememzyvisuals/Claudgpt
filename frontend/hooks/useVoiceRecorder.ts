'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type RecordingState = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

interface UseVoiceRecorderOptions {
  onTranscribed: (text: string) => void;
  onError?:      (msg: string) => void;
  language?:     string;
}

export function useVoiceRecorder({ onTranscribed, onError, language = 'en' }: UseVoiceRecorderOptions) {
  const [state,     setState]     = useState<RecordingState>('idle');
  const [duration,  setDuration]  = useState(0);
  const [amplitude, setAmplitude] = useState<number[]>(Array(20).fill(0));
  const [error,     setError]     = useState<string | null>(null);

  // Use refs for cleanup — avoids stale closure on unmount
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef     = useRef<number>(0);
  const chunksRef        = useRef<Blob[]>([]);
  const isMounted        = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cleanup via refs — no stale closure issues
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      try { mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // ── Waveform animation ──────────────────────────────────
  const startWaveform = useCallback((stream: MediaStream) => {
    try {
      const ctx      = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        if (!isMounted.current) return;
        analyser.getByteFrequencyData(data);
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(data.length / 20));
        for (let i = 0; i < 20; i++) {
          bars.push(Math.min(100, Math.round(((data[i * step] || 0) / 255) * 100)));
        }
        setAmplitude(bars);
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch { /* AudioContext unavailable */ }
  }, []);

  // ── Start ───────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4']
        .find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animFrameRef.current);
        if (audioCtxRef.current) { await audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
        if (isMounted.current) setAmplitude(Array(20).fill(0));

        const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' });
        if (blob.size < 500) { if (isMounted.current) setState('idle'); return; }
        await transcribeBlob(blob);
      };

      recorder.start(100);
      if (isMounted.current) { setState('recording'); setDuration(0); }

      timerRef.current = setInterval(() => {
        if (isMounted.current) setDuration((d) => d + 1);
      }, 1000);

      startWaveform(stream);

    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === 'NotAllowedError' ? 'Microphone permission denied.' : err.message)
        : 'Could not access microphone.';
      if (isMounted.current) { setError(msg); setState('error'); }
      onError?.(msg);
    }
  }, [startWaveform, onError]);

  // ── Stop ────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      mr.stop(); // triggers onstop → transcribeBlob
    }
  }, []);

  // ── Transcribe ──────────────────────────────────────────
  const transcribeBlob = useCallback(async (blob: Blob) => {
    if (isMounted.current) setState('transcribing');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const ext   = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      const form  = new FormData();
      form.append('audio', blob, `voice.${ext}`);
      form.append('language', language);

      const res = await fetch(`${API_URL}/api/stt/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${res.status}`);
      }

      const { text } = await res.json();
      if (isMounted.current) setState('done');

      if (text?.trim()) {
        onTranscribed(text.trim());
      } else {
        if (isMounted.current) { setState('idle'); }
        onError?.('No speech detected. Please try again.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transcription failed.';
      if (isMounted.current) { setError(msg); setState('error'); }
      onError?.(msg);
    }
  }, [language, onTranscribed, onError]);

  // ── Cancel ──────────────────────────────────────────────
  const cancel = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    cancelAnimationFrame(animFrameRef.current);
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      mr.onstop = null; // prevent transcription on cancel
      mr.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {}); audioCtxRef.current = null;
    if (isMounted.current) {
      setAmplitude(Array(20).fill(0));
      setDuration(0);
      setError(null);
      setState('idle');
    }
  }, []);

  return {
    state, duration, amplitude, error,
    isRecording:    state === 'recording',
    isTranscribing: state === 'transcribing',
    startRecording, stopRecording, cancel,
  };
}
