import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
export interface AppError extends Error { statusCode?: number; isOperational?: boolean; }
export const errorMiddleware = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  logger.error(`[${statusCode}] ${err.message}`);
  res.status(statusCode).json({ error: { message: err.message, status: statusCode } });
};
export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
