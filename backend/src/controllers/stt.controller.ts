import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sttService } from '../services/stt.service';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

class STTController {
  async transcribe(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      // multer attaches file to req.file — typed via Express.Multer.File
      const file = (req as Request & { file?: Express.Multer.File }).file;

      if (!file) throw createError('No audio file. Send as multipart field "audio".', 400);
      if (file.size > 25 * 1024 * 1024) throw createError('Audio exceeds 25MB limit.', 413);

      const language = (req.body?.language as string) || 'en';
      const filename = file.originalname || `voice.${(file.mimetype?.split('/')[1] || 'webm')}`;
      const text     = await sttService.transcribe(file.buffer, filename, language);

      if (!text) return res.json({ text: '', message: 'No speech detected.' });

      logger.info(`STT: user=${authReq.user?.id}, chars=${text.length}`);
      res.json({ text, model: 'whisper-large-v3-turbo' });

    } catch (err) { next(err); }
  }
}

export const sttController = new STTController();
