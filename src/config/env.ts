import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // CUP Solidale
  CUP_ENVIRONMENT: Joi.string().valid('sandbox', 'prod').required(),
  CUP_COMPANY_CODE: Joi.string().required(),
  CUP_API_KEY: Joi.string().required(),

  // GoHighLevel
  GHL_API_TOKEN: Joi.string().required(),
  GHL_LOCATION_ID: Joi.string().required(),

  // Database
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),

  // Sync Configuration
  SYNC_INTERVAL_MINUTES: Joi.number().default(5),
  MAX_RETRIES: Joi.number().default(3),
  BATCH_SIZE: Joi.number().default(100),
  WEBHOOK_SECRET: Joi.string().required(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100)
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  logLevel: envVars.LOG_LEVEL,

  cup: {
    environment: envVars.CUP_ENVIRONMENT,
    companyCode: envVars.CUP_COMPANY_CODE,
    apiKey: envVars.CUP_API_KEY,
    baseUrl: envVars.CUP_ENVIRONMENT === 'prod'
      ? 'https://api.cupsolidale.it/api/v1'
      : 'https://sandboxapi.cupsolidale.it/api/v1'
  },

  ghl: {
    apiToken: envVars.GHL_API_TOKEN,
    locationId: envVars.GHL_LOCATION_ID,
    baseUrl: 'https://services.leadconnectorhq.com'
  },

  database: {
    url: envVars.DATABASE_URL
  },

  redis: {
    url: envVars.REDIS_URL
  },

  sync: {
    intervalMinutes: envVars.SYNC_INTERVAL_MINUTES,
    maxRetries: envVars.MAX_RETRIES,
    batchSize: envVars.BATCH_SIZE
  },

  webhook: {
    secret: envVars.WEBHOOK_SECRET
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS
  }
};

export type Config = typeof config;