// Cobalt public API cluster service
import { logger } from '../utils/logger.js';

let cobaltInstances: string[] = [
  "https://apicobalt.mgytr.top",
  "https://cobaltapi.squair.xyz",
  "https://cobaltapi.kittycat.boo",
  "https://api.cobalt.tools",
  "https://cobalt.alpha.wolfy.love",
  "https://nuko-c.meowing.de",
  "https://api.qwkuns.me",
];

export async function updateCobaltInstances() {
  try {
    const response = await fetch("https://cobalt.directory/api/working?type=api");
    if (response.ok) {
      const json = await response.json() as any;
      if (json?.data) {
        const urls = new Set<string>();
        for (const service of Object.keys(json.data)) {
          if (Array.isArray(json.data[service])) {
            for (const url of json.data[service]) urls.add(url);
          }
        }
        if (urls.size > 0) {
          cobaltInstances = Array.from(urls);
          logger.info('Cobalt', `${cobaltInstances.length} instâncias atualizadas.`);
        }
      }
    }
  } catch (err: any) {
    logger.warn('Cobalt', 'Falha ao atualizar instâncias.', { error: err.message });
  }
}

export interface CobaltResult {
  url: string;
  filename?: string;
}

export async function getCobaltDownloadUrl(
  url: string,
  options: { isMp3?: boolean; videoQuality?: string; audioBitrate?: string }
): Promise<CobaltResult | null> {
  const { isMp3 = false, videoQuality = '1080', audioBitrate = '128' } = options;

  let timeoutCount = 0;
  let tried = 0;

  for (const instance of cobaltInstances) {
    if (timeoutCount >= 3 || tried >= 10) break;
    tried++;

    try {
      const endpoint = `${instance}/`;
      const body = isMp3
        ? { url, downloadMode: 'audio', audioFormat: 'mp3', audioBitrate, filenameStyle: 'basic' }
        : { url, videoQuality, downloadMode: 'auto', filenameStyle: 'basic' };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        if (['tunnel', 'redirect', 'stream', 'success'].includes(data.status) && data.url) {
          logger.info('Cobalt', `✓ ${instance} → ${data.status}`);
          return { url: data.url, filename: data.filename };
        }
        if (data.status === 'picker' && Array.isArray(data.picker) && data.picker[0]?.url) {
          return { url: data.picker[0].url, filename: data.picker?.[0]?.filename };
        }
        logger.debug('Cobalt', `${instance} status: ${data.status}`);
      } else {
        logger.debug('Cobalt', `${instance} HTTP ${resp.status}`);
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.message?.includes('aborted')) {
        timeoutCount++;
      }
      logger.debug('Cobalt', `${instance} erro: ${err.message}`);
    }
  }

  logger.warn('Cobalt', 'Todas as instâncias falharam.');
  return null;
}

// Init
updateCobaltInstances();
setInterval(updateCobaltInstances, 30 * 60 * 1000);
