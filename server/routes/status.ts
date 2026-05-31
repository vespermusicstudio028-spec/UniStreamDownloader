import { Router } from 'express';
import os from 'os';
import process from 'process';
import fs from 'fs';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import { getActiveJobCount } from '../services/jobManager.js';
import { metadataCache } from '../utils/cache.js';

const router = Router();

// Track server start time
const SERVER_START = Date.now();
let requestCount = 0;
let totalDownloads = 0;

export function incrementDownloadCount() {
  totalDownloads++;
}

// Simple request counting middleware
router.use((_req, _res, next) => {
  requestCount++;
  next();
});

// GET /api/status — System health dashboard
router.get('/', async (req, res) => {
  const start = Date.now();

  // Memory info
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  // Process memory
  const procMem = process.memoryUsage();

  // CPU info
  const cpuModel = os.cpus()[0]?.model || 'Unknown';
  const cpuCount = os.cpus().length;

  // FFmpeg check
  const ffmpegAvailable = !!(ffmpegStatic && fs.existsSync(ffmpegStatic as string));

  // Uptime
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START) / 1000);
  const uptimeStr = formatUptime(uptimeSeconds);

  // Load average (unix only, fallback on windows)
  const loadAvg = os.loadavg();

  // Disk space check (tmp dir)
  let diskInfo: any = null;
  try {
    const tmpPath = path.join(process.cwd(), 'tmp');
    if (fs.existsSync(tmpPath)) {
      const files = fs.readdirSync(tmpPath);
      diskInfo = { tmpFiles: files.length };
    }
  } catch {}

  const responseTime = Date.now() - start;

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: uptimeStr,
    uptimeSeconds,
    responseTime,

    services: {
      api: { status: 'online', label: 'API' },
      ffmpeg: {
        status: ffmpegAvailable ? 'online' : 'offline',
        label: 'FFmpeg (Conversor)',
        path: ffmpegStatic || null,
      },
      cache: {
        status: 'online',
        label: 'Cache',
        entries: metadataCache.size(),
      },
    },

    system: {
      memory: {
        total: formatBytes(totalMem),
        used: formatBytes(usedMem),
        free: formatBytes(freeMem),
        percent: memPercent,
      },
      process: {
        heapUsed: formatBytes(procMem.heapUsed),
        heapTotal: formatBytes(procMem.heapTotal),
        rss: formatBytes(procMem.rss),
      },
      cpu: {
        model: cpuModel,
        cores: cpuCount,
        loadAvg: loadAvg.map((l) => l.toFixed(2)),
      },
      platform: os.platform(),
      nodeVersion: process.version,
    },

    jobs: {
      active: getActiveJobCount(),
      totalDownloads,
      requestCount,
    },

    disk: diskInfo,
  });
});

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default router;
