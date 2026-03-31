import Groq, { toFile } from 'groq-sdk';
import { keyRotator } from '../engine/KeyRotator';
import { logger } from '../utils/logger';

class STTService {
  // Production model — confirmed active March 2026
  // 216x real-time, multilingual, $0.04/hour
  private readonly MODEL = 'whisper-large-v3-turbo';

  /**
   * Transcribe audio buffer.
   * Uses toFile() from groq-sdk — the official recommended approach
   * for Node.js environments (works on Node 18, 20, 22).
   * Confirmed from official groq-sdk 0.37.0 documentation.
   */
  async transcribe(
    audioBuffer: Buffer,
    filename:    string,
    language =   'en'
  ): Promise<string> {
    const key    = keyRotator.getKey();
    const client = new Groq({ apiKey: key });
    const mime   = this.getMimeType(filename);

    logger.info(`STT: ${filename} (${audioBuffer.length} bytes, ${mime})`);

    try {
      // toFile() is the groq-sdk helper for converting Buffer to file upload
      // Official example: await toFile(Buffer.from('my bytes'), 'file')
      const file = await toFile(audioBuffer, filename, { type: mime });

      const transcription = await client.audio.transcriptions.create({
        file,
        model:           this.MODEL,
        response_format: 'json',
        language,
        temperature:     0.0,
        prompt:          'Developer talking about code, web apps, APIs, and software.',
      });

      keyRotator.reportSuccess(key);
      const text = transcription.text?.trim() || '';
      logger.info(`STT: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`);
      return text;

    } catch (err: unknown) {
      keyRotator.reportFailure(key);
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('STT error:', msg);

      if (msg.includes('413') || msg.toLowerCase().includes('too large')) {
        throw new Error('Audio file too large. Maximum is 25 MB.');
      }
      if (msg.includes('format') || msg.includes('codec') || msg.includes('Invalid file')) {
        throw new Error('Unsupported audio format. Use webm, wav, mp3, or mp4.');
      }
      throw new Error(`Transcription failed: ${msg}`);
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || 'webm';
    const map: Record<string, string> = {
      webm: 'audio/webm',
      wav:  'audio/wav',
      mp3:  'audio/mpeg',
      mp4:  'audio/mp4',
      m4a:  'audio/mp4',
      ogg:  'audio/ogg',
      flac: 'audio/flac',
      mpeg: 'audio/mpeg',
      mpga: 'audio/mpeg',
    };
    return map[ext] || 'audio/webm';
  }
}

export const sttService = new STTService();
