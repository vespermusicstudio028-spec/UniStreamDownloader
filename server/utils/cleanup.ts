import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

const TMP_DIR = path.join(process.cwd(), 'tmp');
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hora

export function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    logger.info('Cleanup', `Diretório tmp criado: ${TMP_DIR}`);
  }
  return TMP_DIR;
}

export function getTmpPath(filename: string): string {
  ensureTmpDir();
  return path.join(TMP_DIR, filename);
}

export function cleanupFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug('Cleanup', `Arquivo removido: ${path.basename(filePath)}`);
    }
  } catch (err: any) {
    logger.warn('Cleanup', `Falha ao remover arquivo: ${filePath}`, { error: err.message });
  }
}

export function cleanupOldFiles() {
  if (!fs.existsSync(TMP_DIR)) return;

  const now = Date.now();
  let removed = 0;

  try {
    const files = fs.readdirSync(TMP_DIR);
    for (const file of files) {
      const filePath = path.join(TMP_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > MAX_AGE_MS) {
          fs.unlinkSync(filePath);
          removed++;
        }
      } catch {
        // ignore individual file errors
      }
    }
    if (removed > 0) {
      logger.info('Cleanup', `Limpeza automática: ${removed} arquivo(s) antigo(s) removido(s).`);
    }
  } catch (err: any) {
    logger.warn('Cleanup', 'Erro na limpeza automática.', { error: err.message });
  }
}

// Iniciar limpeza automática a cada 30 minutos
export function startAutoCleanup() {
  ensureTmpDir();
  cleanupOldFiles(); // run once on startup
  setInterval(cleanupOldFiles, 30 * 60 * 1000);
  logger.info('Cleanup', 'Limpeza automática de arquivos temporários iniciada (a cada 30min).');
}
