import rateLimit from 'express-rate-limit';
export const rateLimitMiddleware = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests.' } });
export const strictRateLimit = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Rate limit exceeded.' } });
