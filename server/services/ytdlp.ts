import youtubedl from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { getTmpPath } from '../utils/cleanup.js';

export interface YtdlpDownloadOptions {
  url: string;
  quality?: string; // e.g., '1080', '720', 'bestaudio'
  audioOnly?: boolean;
  outputFilename?: string;
  onProgress?: (percent: number, speed: string, eta: string) => void;
}

export interface YtdlpResult {
  filePath: string;
  filename: string;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100)
    .trim();
}

export async function downloadWithYtdlp(options: YtdlpDownloadOptions): Promise<YtdlpResult> {
  const { url, quality = '1080', audioOnly = false, outputFilename } = options;

  const ext = audioOnly ? 'webm' : 'mp4';
  const safeName = outputFilename
    ? sanitizeFilename(outputFilename)
    : `unistream_${Date.now()}`;

  getTmpPath('x'); // garante que o diretório tmp existe
  const outputPath = `tmp/${safeName}.%(ext)s`;

  logger.info('yt-dlp', `Iniciando download: ${url} [${audioOnly ? 'áudio' : quality + 'p'}]`);

  const formatArg = audioOnly
    ? 'bestaudio/best'
    : `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]/best`;

  try {
    await (youtubedl as any)(url, {
      format: formatArg,
      output: outputPath,
      noWarnings: true,
      noCheckCertificates: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
      mergeOutputFormat: 'mp4',
    });

    // Find the resulting file
    const tmpDir = path.dirname(getTmpPath('x'));
    const files = fs.readdirSync(tmpDir);
    const downloaded = files
      .filter(f => f.startsWith(safeName))
      .map(f => ({ name: f, path: path.join(tmpDir, f), mtime: fs.statSync(path.join(tmpDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (downloaded.length === 0) {
      throw new Error('Arquivo não encontrado após download');
    }

    const result = downloaded[0];
    logger.info('yt-dlp', `Download concluído: ${result.name}`);
    return { filePath: result.path, filename: result.name };
  } catch (err: any) {
    logger.error('yt-dlp', `Falha no download`, { error: err.message });
    throw err;
  }
}
