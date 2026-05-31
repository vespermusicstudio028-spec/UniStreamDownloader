import { Router } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { getCobaltDownloadUrl } from '../services/cobalt.js';
import { createJob, updateJob, addClient, getJob } from '../services/jobManager.js';
import { validateAudioFile } from '../services/audioValidator.js';
import { logger } from '../utils/logger.js';
import { getTmpPath, cleanupFile } from '../utils/cleanup.js';
import { downloadWithYtdlp } from '../services/ytdlp.js';
import { convertToMp3 } from '../services/ffmpeg.js';

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

  updateJob(jobId, { status: 'downloading', progress: 5, message: '🎵 Buscando link de áudio...' });

  // Try Cobalt first (fast path — direct download link)
  const cobaltResult = await getCobaltDownloadUrl(url, {
    isMp3: true,
    audioBitrate: '128',
  });

  if (cobaltResult) {
    updateJob(jobId, {
      status: 'done',
      progress: 100,
      message: '✅ MP3 pronto!',
      filePath: cobaltResult.url,
      filename: cobaltResult.filename || `${sanitizedTitle}.mp3`,
      convertedAt: Date.now(),
      format: 'mp3',
    });
    logger.info('Route/mp3', `Job ${jobId} concluído via Cobalt.`);
    return;
  }

  // Fallback: full server-side conversion with yt-dlp + ffmpeg + validation
  updateJob(jobId, { progress: 15, message: '⬇️ Baixando áudio...' });

  let audioSourcePath: string | null = null;
  const outputPath = getTmpPath(`${sanitizedTitle}_${jobId}.mp3`);

  try {
    // Download raw audio
    const downloaded = await downloadWithYtdlp({
      url,
      audioOnly: true,
      outputFilename: `${sanitizedTitle}_${jobId}_src`,
      onProgress: (pct) => {
        updateJob(jobId, { progress: 15 + Math.round(pct * 0.45), message: `⬇️ Baixando... ${pct}%` });
      },
    });
    audioSourcePath = downloaded.filePath;

    // Convert to MP3 CBR 128kbps / 44.1kHz / Stereo / ID3v2.3
    updateJob(jobId, { status: 'converting', progress: 60, message: '🔄 Convertendo para MP3...' });

    await convertToMp3({
      inputPath: audioSourcePath,
      outputPath,
      title: sanitizedTitle,
      artist,
      onProgress: (pct) => {
        updateJob(jobId, { progress: 60 + Math.round(pct * 0.3), message: `🔄 Convertendo... ${pct}%` });
      },
    });

    // Validate the output before releasing to download
    updateJob(jobId, { status: 'validating', progress: 92, message: '🔍 Validando arquivo...' });

    const validation = await validateAudioFile(outputPath);

    if (!validation.valid) {
      throw new Error(`Arquivo falhou na validação: ${validation.errors.join('; ')}`);
    }

    // All tests passed — release download
    const fileSize = fs.statSync(outputPath).size;

    updateJob(jobId, {
      status: 'done',
      progress: 100,
      message: '✅ MP3 pronto e validado!',
      filePath: `/api/mp3/file/${jobId}`,
      filename: `${sanitizedTitle}.mp3`,
      duration: validation.duration,
      bitrate: validation.bitrate,
      sampleRate: validation.sampleRate,
      channels: validation.channels,
      fileSize: validation.fileSize || fileSize,
      format: 'mp3',
      convertedAt: Date.now(),
    });

    logger.info('Route/mp3', `Job ${jobId} concluído via yt-dlp+ffmpeg. Duração: ${validation.duration.toFixed(1)}s | ${validation.bitrate}kbps`);

  } finally {
    // Clean up source file
    if (audioSourcePath && fs.existsSync(audioSourcePath)) {
      cleanupFile(audioSourcePath);
    }
  }
}

// GET /api/mp3/progress/:jobId — SSE stream
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

  const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => clearInterval(keepAlive));
});

// GET /api/mp3/file/:jobId — Serve the converted MP3 file
router.get('/file/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job || job.status !== 'done') {
    return res.status(404).json({ error: 'Arquivo não disponível.' });
  }

  const filePath = job.filePath || '';

  // External URL redirect (Cobalt)
  if (filePath.startsWith('http')) {
    return res.redirect(filePath);
  }

  // Local file
  const localPath = getTmpPath(`${job.filename?.replace('.mp3', '') || jobId}.mp3`);
  const candidates = [
    localPath,
    getTmpPath(`${job.filename || jobId}`),
  ].filter(p => fs.existsSync(p));

  if (candidates.length === 0) {
    return res.status(404).json({ error: 'Arquivo MP3 não encontrado no servidor.' });
  }

  const finalPath = candidates[0];
  const filename = job.filename || path.basename(finalPath);

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', String(fs.statSync(finalPath).size));

  const stream = fs.createReadStream(finalPath);
  stream.pipe(res);
  stream.on('end', () => {
    setTimeout(() => cleanupFile(finalPath), 10000);
  });
});

export default router;
