/**
 * Routes per i webhook CUP Solidale
 */

import { Router, Request, Response } from 'express';
import { CupToGhlSyncService, WebhookPayload, MappingConfig } from '../services/sync/cup-to-ghl';
import { verifyWebhook } from '../middleware/webhook-auth';
import { logger } from '../utils/logger';
import { mappingConfig } from '../config/mapping';

const router = Router();

// Inizializza il sync service
const syncService = new CupToGhlSyncService(mappingConfig);

/**
 * POST /webhook/cup-solidale
 * Endpoint principale per ricevere webhook da CUP Solidale
 */
router.post('/cup-solidale', verifyWebhook, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const payload = req.body as WebhookPayload;

  logger.info('Webhook ricevuto', {
    event_type: payload.event_type,
    timestamp: payload.timestamp
  });

  // Validazione base
  if (!payload.event_type || !payload.data) {
    logger.warn('Webhook payload invalido', { payload });
    res.status(400).json({
      success: false,
      error: 'Invalid payload: missing event_type or data'
    });
    return;
  }

  try {
    const result = await syncService.handleWebhook(payload);

    const duration = Date.now() - startTime;
    logger.info('Webhook elaborato', {
      duration_ms: duration,
      ...result
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(422).json(result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;

    logger.error('Webhook errore', {
      event_type: payload.event_type,
      error: errorMessage,
      duration_ms: duration
    });

    res.status(500).json({
      success: false,
      event_type: payload.event_type,
      error: errorMessage
    } as const);
  }
});

/**
 * GET /webhook/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cup-solidale-webhook'
  });
});

/**
 * GET /webhook/mapping
 * Restituisce la configurazione mapping corrente (per debug)
 */
router.get('/mapping', (_req: Request, res: Response) => {
  const currentMapping = syncService.getMapping();
  res.status(200).json({
    calendars: Object.keys(currentMapping.calendars).length,
    dottori: Object.keys(currentMapping.dottori).length,
    mapping: currentMapping
  });
});

/**
 * PUT /webhook/mapping
 * Aggiorna la configurazione mapping (protetto)
 */
router.put('/mapping', verifyWebhook, (req: Request, res: Response) => {
  const newMapping = req.body as MappingConfig;

  if (!newMapping.calendars || !newMapping.dottori) {
    res.status(400).json({ error: 'Invalid mapping: missing calendars or dottori' });
    return;
  }

  syncService.updateMapping(newMapping);
  logger.info('Mapping aggiornato', {
    calendars: Object.keys(newMapping.calendars).length,
    dottori: Object.keys(newMapping.dottori).length
  });

  res.status(200).json({
    success: true,
    message: 'Mapping updated'
  });
});

export default router;
