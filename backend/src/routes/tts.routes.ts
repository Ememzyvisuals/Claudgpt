import { Router } from 'express';
import { ttsController } from '../controllers/tts.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { strictRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();
router.use(authMiddleware);
router.post('/speak',  strictRateLimit, ttsController.speak);
router.get('/voices',  ttsController.getVoices);
export default router;
