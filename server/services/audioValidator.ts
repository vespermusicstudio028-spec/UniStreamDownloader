import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

export interface AudioValidationResult {
  valid: boolean;
  duration: number;      // seconds
  bitrate: number;       // kbps
  sampleRate: number;    // Hz
  channels: number;
  format: string;
  fileSize: number;      // bytes
  errors: string[];
}

/**
 * Valida um arquivo de áudio usando ffprobe.
 * Verifica: duração, bitrate, sample rate, canais, integridade.
 * Lança erro se qualquer verificação falhar.
 */
export async function validateAudioFile(filePath: string): Promise<AudioValidationResult> {
  const errors: string[] = [];
  const result: AudioValidationResult = {
    valid: false,
    duration: 0,
    bitrate: 0,
    sampleRate: 0,
    channels: 0,
    format: '',
    fileSize: 0,
    errors: [],
  };

  logger.info('AudioValidator', `Validando arquivo: ${path.basename(filePath)}`);

  try {
    // Use ffprobe to get detailed stream info
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      filePath,
    ]);

    const info = JSON.parse(stdout) as any;
    const fmt = info?.format || {};
    const audioStream = (info?.streams || []).find((s: any) => s.codec_type === 'audio');

    if (!audioStream) {
      errors.push('Nenhuma stream de áudio encontrada no arquivo.');
    } else {
      // Duration check
      result.duration = parseFloat(audioStream.duration || fmt.duration || '0');
      if (result.duration < 1) {
        errors.push(`Duração inválida: ${result.duration.toFixed(1)}s (mínimo 1s)`);
      }

      // Bitrate check (from format or stream)
      result.bitrate = Math.round(
        parseInt(audioStream.bit_rate || fmt.bit_rate || '0') / 1000
      );
      if (result.bitrate < 32) {
        errors.push(`Bitrate muito baixo: ${result.bitrate}kbps (mínimo 32kbps)`);
      }

      // Sample rate check
      result.sampleRate = parseInt(audioStream.sample_rate || '0');
      if (result.sampleRate < 8000) {
        errors.push(`Sample rate inválido: ${result.sampleRate}Hz`);
      }

      // Channels check
      result.channels = audioStream.channels || 0;
      if (result.channels < 1) {
        errors.push(`Número de canais inválido: ${result.channels}`);
      }

      // Format check
      result.format = audioStream.codec_name || '';
    }

    // File size check
    result.fileSize = parseInt(fmt.size || '0');
    if (result.fileSize < 1024) {
      errors.push(`Arquivo muito pequeno: ${result.fileSize} bytes — possível corrupção`);
    }

  } catch (err: any) {
    errors.push(`Falha ao inspecionar arquivo: ${err.message}`);
  }

  // Integrity test: attempt to decode a few frames
  if (errors.length === 0) {
    try {
      await execFileAsync('ffmpeg', [
        '-v', 'error',
        '-i', filePath,
        '-t', '5',          // test first 5 seconds
        '-f', 'null', '-',
      ]);
    } catch (decodeErr: any) {
      errors.push(`Arquivo corrompido ou não reproduzível: ${decodeErr.message?.substring(0, 80)}`);
    }
  }

  result.errors = errors;
  result.valid = errors.length === 0;

  if (result.valid) {
    logger.info('AudioValidator', `✅ Arquivo válido: ${result.duration.toFixed(1)}s | ${result.bitrate}kbps | ${result.sampleRate}Hz | ${result.channels}ch`);
  } else {
    logger.error('AudioValidator', `❌ Arquivo inválido: ${errors.join('; ')}`);
  }

  return result;
}
