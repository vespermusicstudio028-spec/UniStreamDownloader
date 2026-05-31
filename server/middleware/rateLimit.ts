import { Request, Response, NextFunction, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

/**
 * Rate limiter for metadata/info endpoints.
 * 30 requests per minute per IP.
 */
export const infoRateLimit: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições. Aguarde um momento e tente novamente.',
    retryAfter: 60,
  },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for download/conversion endpoints.
 * 5 downloads per minute per IP.
 */
export const downloadRateLimit: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Limite de downloads atingido. Aguarde 1 minuto e tente novamente.',
    retryAfter: 60,
  },
});

/**
 * Rate limiter for transcription endpoints.
 * 3 per minute per IP (more expensive).
 */
export const transcribeRateLimit: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Limite de transcrições atingido. Aguarde um momento.',
    retryAfter: 60,
  },
});
