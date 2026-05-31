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
  bitrate?: number; // kept for API compat, but always uses 128 CBR
  title?: string;
  artist?: string;
  album?: string;
  onProgress?: (percent: number) => void;
}

export function mergeVideoAudio(options: MergeOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { videoPath, audioPath, outputPath, onProgress } = options;
    logger.info('FFmpeg', `Unindo vídeo + áudio → ${path.basename(outputPath)}`);

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v copy',
        '-c:a aac',
        '-b:a 128k',
        '-strict experimental',
        '-movflags +faststart',
        '-map_metadata -1',
      ])
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

/**
 * Converts any audio/video to MP3 with strict compatibility settings:
 * - CBR (Constant Bitrate) 128kbps
 * - 44.1kHz sample rate
 * - Stereo (2 channels)
 * - ID3v2.3 tags (maximum device compatibility: Android, iPhone, Windows, iTunes)
 * - No embedded cover art (removes oversized thumbnails)
 * - Clean metadata only (title, artist, album)
 */
export function convertToMp3(options: ConvertMp3Options): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      inputPath,
      outputPath,
      title = '',
      artist = '',
      album = '',
      onProgress,
    } = options;

    // Sanitize metadata values to avoid ffmpeg injection
    const safe = (s: string) => s.replace(/[=\\'"]/g, '').substring(0, 100);

    logger.info('FFmpeg', `Convertendo para MP3 CBR 128kbps → ${path.basename(outputPath)}`);

    const outputOptions: string[] = [
      // Select first audio stream only (no video)
      '-map', '0:a:0',
      // CBR fixed bitrate
      '-b:a', '128k',
      // Sample rate 44.1kHz
      '-ar', '44100',
      // Stereo
      '-ac', '2',
      // ID3v2.3 (widest device support: older players, iTunes, Windows Media Player)
      '-write_id3v1', '1',
      '-id3v2_version', '3',
      // Wipe ALL pre-existing metadata (removes incompatible tags + large cover art)
      '-map_metadata', '-1',
    ];

    // Add clean ID3 tags
    if (title)  { outputOptions.push('-metadata', `title=${safe(title)}`);  }
    if (artist) { outputOptions.push('-metadata', `artist=${safe(artist)}`); }
    if (album)  { outputOptions.push('-metadata', `album=${safe(album)}`);  }

    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .outputOptions(outputOptions)
      .outputFormat('mp3')
      .output(outputPath)
      .on('progress', (progress) => {
        if (progress.percent && onProgress) {
          onProgress(Math.min(99, Math.round(progress.percent)));
        }
      })
      .on('end', () => {
        logger.info('FFmpeg', `MP3 CBR 128kbps concluído: ${path.basename(outputPath)}`);
        resolve();
      })
      .on('error', (err) => {
        logger.error('FFmpeg', `Erro na conversão MP3: ${err.message}`);
        reject(err);
      })
      .run();
  });
}
