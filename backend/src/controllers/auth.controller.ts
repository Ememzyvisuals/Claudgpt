import { Request, Response, NextFunction } from 'express';
import { supabaseService } from '../services/supabase.service';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password) throw createError('Email and password required', 400);
      const { data, error } = await supabaseService.getClient().auth.signUp({ email, password, options: { data: { full_name: fullName || '' } } });
      if (error) throw createError(error.message, 400);
      res.status(201).json({ message: 'Account created. Check email.', user: data.user });
    } catch (err) { next(err); }
  }
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw createError('Email and password required', 400);
      const { data, error } = await supabaseService.getClient().auth.signInWithPassword({ email, password });
      if (error) throw createError('Invalid credentials', 401);
      res.json({ user: data.user, session: data.session });
    } catch (err) { next(err); }
  }
  async logout(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json({ message: 'Logged out' }); } catch (err) { next(err); }
  }
  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try { const user = await supabaseService.getUserById(req.user!.id); res.json({ user }); } catch (err) { next(err); }
  }
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError('Refresh token required', 400);
      const { data, error } = await supabaseService.getClient().auth.refreshSession({ refresh_token: refreshToken });
      if (error) throw createError(error.message, 401);
      res.json({ session: data.session });
    } catch (err) { next(err); }
  }
  async googleOAuth(_req: Request, res: Response, next: NextFunction) {
    try {
      const { data, error } = await supabaseService.getClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.ALLOWED_ORIGINS?.split(',')[0]}/dashboard` } });
      if (error) throw createError(error.message, 400);
      res.json({ url: data.url });
    } catch (err) { next(err); }
  }
  async githubOAuth(_req: Request, res: Response, next: NextFunction) {
    try {
      const { data, error } = await supabaseService.getClient().auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${process.env.ALLOWED_ORIGINS?.split(',')[0]}/dashboard` } });
      if (error) throw createError(error.message, 400);
      res.json({ url: data.url });
    } catch (err) { next(err); }
  }
}
export const authController = new AuthController();
