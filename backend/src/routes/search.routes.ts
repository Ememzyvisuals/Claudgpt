import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { strictRateLimit } from '../middleware/rateLimit.middleware';
import { groqEngine } from '../engine/GroqEngine';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// POST /api/search — direct web search endpoint
router.post('/', strictRateLimit, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) {
      res.status(400).json({ error: { message: 'query is required' } });
      return;
    }
    const { response, usedSearch } = await groqEngine.webSearch(query.trim());
    res.json({ response, usedSearch, model: 'groq/compound' });
  } catch (err) { next(err); }
});

export default router;
