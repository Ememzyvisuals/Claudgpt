import { Router } from 'express';
import { attachmentController } from '../controllers/attachment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { strictRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();
router.use(authMiddleware);

// Parse uploaded file (base64 encoded body)
router.post('/parse-file',   strictRateLimit, attachmentController.parseFile);
// Analyse image with vision model
router.post('/analyse-image', strictRateLimit, attachmentController.analyseImage);
// Fetch GitHub repository
router.post('/github',        strictRateLimit, attachmentController.fetchGitHub);
// Chat with attachments (files + optional image)
router.post('/chat-with-context', strictRateLimit, attachmentController.chatWithContext);

export default router;
