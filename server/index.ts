import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

// New modular routes
import infoRouter from './routes/info.js';
import downloadRouter from './routes/download.js';
import mp3Router from './routes/mp3.js';
import transcribeRouter from './routes/transcribe.js';

// Utils
import { startAutoCleanup } from './utils/cleanup.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middlewares
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers (no popups, no redirects to external)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS for PWA clients
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ========================
// New Organized API Routes
// ========================
app.use('/api/info', infoRouter);
app.use('/api/download', downloadRouter);
app.use('/api/mp3', mp3Router);
app.use('/api/transcribe', transcribeRouter);

// ========================
// Legacy routes (kept for compatibility)
// ========================
// Import and mount the legacy server routes
import '../server.js';

// ========================
// Static / Frontend serving
// ========================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true,
      setHeaders: (res, filePath) => {
        // Don't cache index.html
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info('Server', `🚀 UniStream Pro rodando em http://localhost:${PORT}`);
  });
}

// Start cleanup service
startAutoCleanup();

startServer().catch((err) => {
  logger.error('Server', 'Falha ao iniciar o servidor', { error: err.message });
  process.exit(1);
});

export { app };
