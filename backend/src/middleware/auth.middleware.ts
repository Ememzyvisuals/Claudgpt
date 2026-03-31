import { Request, Response, NextFunction } from 'express';
import { supabaseService } from '../services/supabase.service';
import { logger } from '../utils/logger';

// Extend Express Request with user + all standard fields preserved
export interface AuthRequest extends Request {
  user?: {
    id:    string;
    email: string;
    role:  string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: { message: 'Missing or invalid authorization header' } });
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabaseService.verifyToken(token);

    if (error || !data.user) {
      res.status(401).json({ error: { message: 'Invalid or expired token' } });
      return;
    }

    req.user = {
      id:    data.user.id,
      email: data.user.email || '',
      role:  data.user.role  || 'user',
    };

    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    res.status(500).json({ error: { message: 'Authentication error' } });
  }
};
