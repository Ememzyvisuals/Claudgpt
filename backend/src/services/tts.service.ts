import Groq from 'groq-sdk';
import { keyRotator } from '../engine/KeyRotator';
import { logger } from '../utils/logger';

export const ORPHEUS_VOICES = [
  'tara', 'dan', 'leo', 'mia', 'zac', 'zoe',
  'autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy',
] as const;

export type OrpheusVoice = typeof ORPHEUS_VOICES[number];

const ORPHEUS_MAX_CHARS = 180;

class TTSService {
  private readonly MODEL = 'canopylabs/orpheus-v1-english';

  private splitIntoChunks(text: string): string[] {
    if (text.length <= ORPHEUS_MAX_CHARS) return [text];
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    let current = '';
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if ((current + ' ' + trimmed).trim().length <= ORPHEUS_MAX_CHARS) {
        current = (current + ' ' + trimmed).trim();
      } else {
        if (current) chunks.push(current);
        if (trimmed.length > ORPHEUS_MAX_CHARS) {
          const words = trimmed.split(' ');
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + ' ' + word).trim().length <= ORPHEUS_MAX_CHARS) {
              wordChunk = (wordChunk + ' ' + word).trim();
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = word;
            }
          }
          if (wordChunk) current = wordChunk;
        } else {
          current = trimmed;
        }
      }
    }
    if (current) chunks.push(current);
    return chunks.filter((c) => c.trim().length > 0);
  }

  async speak(text: string, voice: OrpheusVoice = 'tara'): Promise<Buffer> {
    if (!text?.trim()) throw new Error('Text cannot be empty');
    const clean = this.cleanTextForSpeech(text);
    if (!clean) throw new Error('No speakable content after cleaning');

    const chunks = this.splitIntoChunks(clean);
    const buffers: Buffer[] = [];

    logger.info(`TTS: voice=${voice}, chunks=${chunks.length}, chars=${clean.length}`);

    for (const chunk of chunks) {
      const key    = keyRotator.getKey();
      const client = new Groq({ apiKey: key });

      try {
        // Access audio.speech dynamically to handle SDK version differences
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioApi = (client as any).audio;
        if (!audioApi || !audioApi.speech) {
          throw new Error('groq-sdk installed on Render does not have audio.speech. Run: npm install groq-sdk@latest in backend.');
        }

        const response = await audioApi.speech.create({
          model:           this.MODEL,
          voice,
          input:           chunk,
          response_format: 'wav',
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        buffers.push(buffer);
        keyRotator.reportSuccess(key);
        logger.debug(`TTS chunk done: ${chunk.length} chars → ${buffer.length} bytes`);

      } catch (err: unknown) {
        keyRotator.reportFailure(key);
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('TTS error:', msg);

        if (msg.includes('audio.speech') || msg.includes('installed on Render')) {
          throw new Error(msg);
        }
        if (msg.includes('terms') || msg.includes('403') || msg.includes('consent') || msg.includes('model_not_found')) {
          throw new Error('Orpheus TTS: Accept model terms at console.groq.com/playground?model=canopylabs/orpheus-v1-english');
        }
        if (msg.includes('429') || msg.includes('rate')) {
          throw new Error('TTS rate limit reached. Try again in a moment.');
        }
        throw new Error(`TTS failed: ${msg}`);
      }
    }

    if (buffers.length === 0) throw new Error('No audio generated');
    return Buffer.concat(buffers);
  }

  cleanTextForSpeech(markdown: string): string {
    return markdown
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\|[^\n]+\|/g, '')
      .replace(/[-*_]{3,}/g, '')
      .replace(/\n{3,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  getVoices() { return ORPHEUS_VOICES; }
}

export const ttsService = new TTSService();
