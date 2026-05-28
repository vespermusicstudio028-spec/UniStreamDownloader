import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getCobaltDownloadUrl } from '../services/cobalt.js';
import { createJob, updateJob, addClient, getJob, deleteJob } from '../services/jobManager.js';
import { cleanupFile } from '../utils/cleanup.js';
import { logger } from '../utils/logger.js';

const router = Router();

// POST /api/download
// Body: { url, quality, format, title, duration }
// Returns: { jobId }
router.post('/', async (req, res) => {
  const { url, quality = '1080', format = 'mp4', title = 'video', duration = 0 } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL é obrigatória.' });
  }

  const jobId = crypto.randomUUID();
  createJob(jobId);

  // Respond immediately with jobId
  res.json({ jobId });

  // Process in background
  processDownload(jobId, url, quality, format, title, Number(duration)).catch((err) => {
    logger.error('Route/download', `Job ${jobId} falhou`, { error: err.message });
    updateJob(jobId, {
      status: 'error',
      error: err.message || 'Falha desconhecida no download.',
      message: '❌ Falha no download.',
    });
  });
});

async function processDownload(jobId: string, url: string, quality: string, format: string, title: string, duration: number = 0) {
  const cleanQuality = quality.replace(/[^0-9]/g, '') || '1080';
  const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '').substring(0, 80).trim() || 'video';

  updateJob(jobId, { status: 'downloading', progress: 5, message: '🔍 Buscando link de download...' });

  // Estimate size first
  let sizeStr = '';
  if (duration > 0) {
    let mbPerSec = 0.5;
    const q = parseInt(cleanQuality) || 1080;
    if (q >= 1080) mbPerSec = 1.5;
    else if (q >= 720) mbPerSec = 0.9;
    else if (q >= 480) mbPerSec = 0.5;
    else mbPerSec = 0.25;
    sizeStr = (duration * mbPerSec).toFixed(1) + ' MB';
    updateJob(jobId, { fileSize: sizeStr });
  }

  // Try Cobalt first (fast path)
  const cobaltResult = await getCobaltDownloadUrl(url, {
    isMp3: false,
    videoQuality: cleanQuality,
  });

  if (cobaltResult) {
    // Try to get actual size via HEAD request
    try {
      const headResp = await fetch(cobaltResult.url, { method: 'HEAD', signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(2000) : undefined });
      const len = headResp.headers.get('content-length');
      if (len) {
        const bytes = parseInt(len);
        if (!isNaN(bytes) && bytes > 0) {
          sizeStr = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
      }
    } catch (e) {
      // Keep estimation
    }

    updateJob(jobId, {
      status: 'done',
      progress: 100,
      message: '✅ Pronto para salvar!',
      filePath: cobaltResult.url, // external URL
      filename: cobaltResult.filename || `${sanitizedTitle}_${cleanQuality}p.mp4`,
      fileSize: sizeStr,
    });
    logger.info('Route/download', `Job ${jobId} concluído via Cobalt. Tamanho: ${sizeStr}`);
    return;
  }

  // Fallback: direct ytdl-stream for YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    updateJob(jobId, { progress: 20, message: '⬇️ Baixando via servidor...' });
    const streamUrl = `/api/ytdl-stream?url=${encodeURIComponent(url)}&format=mp4&quality=${cleanQuality}&filename=${encodeURIComponent(sanitizedTitle + '.mp4')}`;
    updateJob(jobId, {
      status: 'done',
      progress: 100,
      message: '✅ Pronto para salvar!',
      filePath: streamUrl,
      filename: `${sanitizedTitle}_${cleanQuality}p.mp4`,
      fileSize: sizeStr,
    });
    return;
  }

  throw new Error('Não foi possível processar este link. Tente com uma URL pública válida.');
}

// GET /api/download/progress/:jobId — SSE stream
router.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const added = addClient(jobId, res);
  if (!added) {
    res.write(`data: ${JSON.stringify({ error: 'Job não encontrado' })}\n\n`);
    res.end();
    return;
  }

  // Keep alive
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// GET /api/download/file/:jobId — Download the file
router.get('/file/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job || job.status !== 'done' || !job.filePath) {
    return res.status(404).json({ error: 'Arquivo não disponível.' });
  }

  const filePath = job.filePath;

  // External URL redirect
  if (filePath.startsWith('http')) {
    return res.redirect(filePath);
  }

  // Internal URL forward
  if (filePath.startsWith('/api/')) {
    return res.redirect(filePath);
  }

  // Local file
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });
  }

  const filename = job.filename || path.basename(filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'video/mp4');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('end', () => {
    // Cleanup after serving
    setTimeout(() => {
      cleanupFile(filePath);
      deleteJob(jobId);
    }, 5000);
  });
});

export default router;
