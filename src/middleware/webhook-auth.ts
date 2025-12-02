/**
 * Middleware per verificare la firma HMAC dei webhook CUP Solidale
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface WebhookAuthenticatedRequest extends Request {
  webhookVerified: boolean;
}

/**
 * Verifica la firma HMAC-SHA256 del webhook
 *
 * Header atteso: X-CUP-Signature: sha256=<hex_digest>
 * Il digest è calcolato su: timestamp.body dove timestamp è X-CUP-Timestamp
 */
export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-cup-signature'] as string;
  const timestamp = req.headers['x-cup-timestamp'] as string;

  if (!signature || !timestamp) {
    logger.warn('Webhook missing signature or timestamp headers');
    res.status(401).json({ error: 'Missing authentication headers' });
    return;
  }

  // Verifica che il timestamp non sia troppo vecchio (5 minuti)
  const timestampAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(timestampAge) || timestampAge > 300000) { // 5 minuti
    logger.warn('Webhook timestamp too old or invalid', { timestamp, age: timestampAge });
    res.status(401).json({ error: 'Timestamp expired or invalid' });
    return;
  }

  // Calcola la firma attesa
  const payload = `${timestamp}.${JSON.stringify(req.body)}`;
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', config.webhook.secret)
    .update(payload)
    .digest('hex')}`;

  // Confronto timing-safe
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    logger.warn('Webhook signature mismatch', {
      received: signature.substring(0, 20) + '...',
      expected: expectedSignature.substring(0, 20) + '...'
    });
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  (req as WebhookAuthenticatedRequest).webhookVerified = true;
  logger.debug('Webhook signature verified');
  next();
}

/**
 * Middleware alternativo: verifica solo API Key (più semplice)
 * Header atteso: X-CUP-API-Key: <api_key>
 */
export function verifyApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-cup-api-key'] as string;

  if (!apiKey) {
    logger.warn('Webhook missing API key header');
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  if (apiKey !== config.webhook.secret) {
    logger.warn('Webhook invalid API key');
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  (req as WebhookAuthenticatedRequest).webhookVerified = true;
  logger.debug('Webhook API key verified');
  next();
}

/**
 * Middleware che accetta entrambi i metodi di autenticazione
 */
export function verifyWebhook(req: Request, res: Response, next: NextFunction): void {
  // Se presente signature HMAC, usa quello
  if (req.headers['x-cup-signature']) {
    return verifyWebhookSignature(req, res, next);
  }

  // Altrimenti prova con API key
  if (req.headers['x-cup-api-key']) {
    return verifyApiKey(req, res, next);
  }

  logger.warn('Webhook no authentication provided');
  res.status(401).json({ error: 'No authentication provided' });
}
