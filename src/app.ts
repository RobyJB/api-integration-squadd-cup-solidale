/**
 * CUP Solidale → GoHighLevel Sync Server
 *
 * Entry point dell'applicazione
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import webhookRouter from './routes/webhook';
import { validateMapping, mappingConfig } from './config/mapping';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors?.origins || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CUP-Signature', 'X-CUP-Timestamp', 'X-CUP-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/webhook', limiter);

// Body parsing (JSON)
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration
    });
  });
  next();
});

// Routes
app.use('/webhook', webhookRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'CUP Solidale → GHL Sync',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      webhook: '/webhook/cup-solidale',
      health: '/webhook/health',
      mapping: '/webhook/mapping'
    }
  });
});

// Health check globale
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    error: 'Internal server error',
    message: config.env === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = config.port;
const HOST = process.env.HOST || '0.0.0.0';

// Valida mapping all'avvio
const mappingValid = validateMapping(mappingConfig);
if (!mappingValid) {
  logger.warn('Mapping incompleto - alcuni webhook potrebbero fallire');
}

app.listen(PORT, () => {
  logger.info(`Server avviato su http://${HOST}:${PORT}`);
  logger.info('Ambiente:', { env: config.env, cup_env: config.cup.environment });
  logger.info('Mapping:', {
    calendars: Object.keys(mappingConfig.calendars).length,
    dottori: Object.keys(mappingConfig.dottori).length
  });
});

export default app;
