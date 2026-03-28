import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ttsService, ORPHEUS_VOICES, type OrpheusVoice } from '../services/tts.service';
import { createError } from '../middleware/error.middleware';

class TTSController {
  // ── Speak any text ────────────────────────────────────────
  async speak(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text, voice = 'tara' } = req.body;
      if (!text) throw createError('text is required', 400);

      if (!ORPHEUS_VOICES.includes(voice as OrpheusVoice)) {
        throw createError(`Invalid voice. Available: ${ORPHEUS_VOICES.join(', ')}`, 400);
      }

      // ttsService.speak() handles cleaning internally
      const buffer = await ttsService.speak(text as string, voice as OrpheusVoice);

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-store');
      res.send(buffer);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'TTS failed';
      if (msg.includes('terms') || msg.includes('403') || msg.includes('consent')) {
        res.status(503).json({
          error: { message: 'TTS unavailable: Accept Orpheus terms at console.groq.com/playground' }
        });
        return;
      }
      if (msg.includes('speech') || msg.includes('undefined')) {
        res.status(503).json({
          error: { message: 'TTS unavailable: groq-sdk version does not support audio.speech. Redeploy backend.' }
        });
        return;
      }
      next(err);
    }
  }

  // ── List available voices ─────────────────────────────────
  async getVoices(_req: AuthRequest, res: Response) {
    res.json({ voices: ttsService.getVoices(), model: 'canopylabs/orpheus-v1-english' });
  }
}

export const ttsController = new TTSController();
