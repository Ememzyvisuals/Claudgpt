import { Router } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { sttController } from '../controllers/stt.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { strictRateLimit } from '../middleware/rateLimit.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const ALLOWED = [
      'audio/webm','audio/wav','audio/mpeg','audio/mp4',
      'audio/ogg','audio/flac','video/webm','application/octet-stream',
    ];
    const ok = ALLOWED.includes(file.mimetype) ||
               /\.(webm|wav|mp3|mp4|m4a|ogg|flac|mpeg|mpga)$/i.test(file.originalname || '');
    if (ok) { cb(null, true); }
    else    { cb(new Error(`Unsupported audio type: ${file.mimetype}`)); }
  },
});

const router = Router();
router.use(authMiddleware);
router.post('/transcribe', strictRateLimit, upload.single('audio'), sttController.transcribe);
export default router;
