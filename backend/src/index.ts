import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { logger } from './utils/logger';
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 ClaudGPT Backend running on port ${PORT}`);
  logger.info(`🏢 EMEMZYVISUALS DIGITALS — ClaudGPT API v1.0`);
});
server.on('error', (err) => { logger.error('Server error:', err); process.exit(1); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
