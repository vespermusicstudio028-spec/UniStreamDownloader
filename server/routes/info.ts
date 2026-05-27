import { Router } from 'express';
import { getMediaInfo } from '../services/metadata.js';
import { logger } from '../utils/logger.js';

const router = Router();

// POST /api/info
// Body: { url: string }
// Returns: MediaInfo (title, uploader, duration, thumbnailUrl, formats, platform)
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL é obrigatória.' });
  }

  try {
    logger.info('Route/info', `Solicitação de info: ${url}`);
    const info = await getMediaInfo(url);
    return res.json(info);
  } catch (err: any) {
    logger.error('Route/info', 'Falha ao obter metadados', { error: err.message });
    return res.status(500).json({ error: 'Falha ao analisar o link. Verifique se é uma URL pública válida.' });
  }
});

export default router;
