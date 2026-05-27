import { Router } from 'express';
import crypto from 'crypto';
import { getCobaltDownloadUrl } from '../services/cobalt.js';
import { createJob, updateJob, addClient } from '../services/jobManager.js';
import { logger } from '../utils/logger.js';

const router = Router();

// POST /api/mp3
// Body: { url, bitrate (128|192|256|320), title, artist }
// Returns: { jobId }
router.post('/', async (req, res) => {
  const { url, bitrate = 128, title = 'audio', artist = '' } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL é obrigatória.' });
  }

  const jobId = crypto.randomUUID();
  createJob(jobId);

  res.json({ jobId });

  processMp3(jobId, url, Number(bitrate), title, artist).catch((err) => {
    logger.error('Route/mp3', `Job ${jobId} falhou`, { error: err.message });
    updateJob(jobId, {
      status: 'error',
      error: err.message,
      message: '❌ Falha na conversão MP3.',
    });
  });
});

async function processMp3(jobId: string, url: string, bitrate: number, title: string, artist: string) {
  const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '').substring(0, 80).trim() || 'audio';
  const validBitrates = [128, 192, 256, 320];
  const safeBitrate = validBitrates.includes(bitrate) ? bitrate : 128;

  updateJob(jobId, { status: 'downloading', progress: 10, message: '🎵 Buscando link de áudio...' });

  // Try Cobalt for MP3
  const cobaltResult = await getCobaltDownloadUrl(url, {
    isMp3: true,
    audioBitrate: String(safeBitrate),
  });

  if (cobaltResult) {
    updateJob(jobId, {
      status: 'done',
      progress: 100,
      message: '✅ MP3 pronto!',
      filePath: cobaltResult.url,
      filename: cobaltResult.filename || `${sanitizedTitle}.mp3`,
    });
    logger.info('Route/mp3', `Job ${jobId} concluído via Cobalt.`);
    return;
  }

  // Fallback: ytdl-stream with mp3 format
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const streamUrl = `/api/ytdl-stream?url=${encodeURIComponent(url)}&format=mp3&quality=${safeBitrate}&filename=${encodeURIComponent(sanitizedTitle + '.mp3')}`;
    updateJob(jobId, {
      status: 'done',
      progress: 100,
      message: '✅ MP3 pronto!',
      filePath: streamUrl,
      filename: `${sanitizedTitle}.mp3`,
    });
    return;
  }

  throw new Error('Não foi possível obter o áudio deste link.');
}

// SSE progress + file routes (reuse same pattern as download)
router.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const added = addClient(jobId, res);
  if (!added) {
    res.write(`data: ${JSON.stringify({ error: 'Job não encontrado' })}\n\n`);
    res.end();
    return;
  }

  const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => clearInterval(keepAlive));
});

export default router;
