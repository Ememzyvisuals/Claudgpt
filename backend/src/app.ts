import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import projectRoutes from './routes/project.routes';
import agentRoutes from './routes/agent.routes';
import exportRoutes from './routes/export.routes';
import attachmentRoutes from './routes/attachment.routes';
import ttsRoutes from './routes/tts.routes';
import sttRoutes from './routes/stt.routes';
import searchRoutes from './routes/search.routes';
import settingsRoutes from './routes/settings.routes';

const app: Application = express();
app.use(helmet());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim());
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error(`CORS: ${origin}`))), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api/', rateLimitMiddleware);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: process.env.APP_NAME || 'ClaudGPT', creator: process.env.CREATOR_NAME || 'Emmanuel ARIYO', company: process.env.COMPANY_NAME || 'EMEMZYVISUALS DIGITALS', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/stt', sttRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorMiddleware);
export default app;
