import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { logger } from '../utils/logger.js';

// Point fluent-ffmpeg to the bundled binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
  logger.info('FFmpeg', `Usando FFmpeg em: ${ffmpegStatic}`);
}

export interface MergeOptions {
  videoPath: string;
  audioPath: string;
  outputPath: string;
  onProgress?: (percent: number) => void;
}

export interface ConvertMp3Options {
  inputPath: string;
  outputPath: string;
  bitrate?: number;
  title?: string;
  artist?: string;
  onProgress?: (percent: number) => void;
}

export function mergeVideoAudio(options: MergeOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { videoPath, audioPath, outputPath, onProgress } = options;
    logger.info('FFmpeg', `Unindo vídeo + áudio → ${path.basename(outputPath)}`);

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions(['-c:v copy', '-c:a aac', '-strict experimental', '-movflags +faststart'])
      .output(outputPath)
      .on('progress', (progress) => {
        if (progress.percent && onProgress) {
          onProgress(Math.min(99, Math.round(progress.percent)));
        }
      })
      .on('end', () => {
        logger.info('FFmpeg', `Merge concluído: ${path.basename(outputPath)}`);
        resolve();
      })
      .on('error', (err) => {
        logger.error('FFmpeg', `Erro no merge: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export function convertToMp3(options: ConvertMp3Options): Promise<void> {
  return new Promise((resolve, reject) => {
    const { inputPath, outputPath, bitrate = 320, title = '', artist = '', onProgress } = options;
    logger.info('FFmpeg', `Convertendo para MP3 ${bitrate}kbps → ${path.basename(outputPath)}`);

    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioBitrate(bitrate)
      .outputOptions([
        title ? `-metadata title=${title.replace(/"/g, "'")}` : '',
        artist ? `-metadata artist=${artist.replace(/"/g, "'")}` : '',
      ].filter(Boolean))
      .output(outputPath)
      .on('progress', (progress) => {
        if (progress.percent && onProgress) {
          onProgress(Math.min(99, Math.round(progress.percent)));
        }
      })
      .on('end', () => {
        logger.info('FFmpeg', `MP3 concluído: ${path.basename(outputPath)}`);
        resolve();
      })
      .on('error', (err) => {
        logger.error('FFmpeg', `Erro na conversão MP3: ${err.message}`);
        reject(err);
      })
      .run();
  });
}
