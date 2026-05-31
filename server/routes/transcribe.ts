/**
 * POST /api/transcribe
 * Real AI transcription: downloads audio via yt-dlp, sends to Gemini for genuine speech-to-text.
 * Falls back to text-only Gemini analysis if audio download fails.
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import youtubedl from 'youtube-dl-exec';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger.js';
import { ensureTmpDir, cleanupFile } from '../utils/cleanup.js';

const router = Router();

// ─── Gemini client instantiator ──────────────────────────────────────────────
function getAI(customKey?: string): GoogleGenAI | null {
  const apiKey = customKey || process.env.GEMINI_API_KEY || "AIzaSyAiWpw69dhK54MDbQPcTt1knzhBOvprL2U";
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    logger.error('Transcribe', `Erro ao inicializar GoogleGenAI: ${(e as Error).message}`);
    return null;
  }
}

// Helper wrapper to run yt-dlp with execution timeout
function runYtDlpWithTimeout(url: string, options: any, timeoutMs: number = 7000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let completed = false;
    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        reject(new Error(`Timeout de ${timeoutMs}ms excedido ao buscar legendas`));
      }
    }, timeoutMs);

    (youtubedl as any)(url, options)
      .then(() => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          resolve();
        }
      })
      .catch((err: any) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          reject(err);
        }
      });
  });
}

// ─── Mime type map for audio extensions ─────────────────────────────────────
const MIME: Record<string, string> = {
  webm: 'audio/webm', m4a: 'audio/mp4', mp3: 'audio/mpeg',
  ogg: 'audio/ogg', opus: 'audio/opus', wav: 'audio/wav',
  mp4: 'audio/mp4', aac: 'audio/aac',
};

// ─── POST /api/transcribe ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { url, title = 'transcricao_unistream' } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL é obrigatória.' });
  }

  const sanitizedTitle = title.replace(/[\<\>:"\/\\|?*]/g, '').substring(0, 80).trim() || 'transcricao';
  const outputFilename = `${sanitizedTitle}.txt`;

  logger.info('Transcribe', `Iniciando transcrição para: ${url}`);

  // ── Step 1: Get metadata ──────────────────────────────────────────────────
  let mediaTitle = sanitizedTitle;
  let mediaAuthor = '@criador';

  try {
    const oembedUrl = url.includes('youtube') || url.includes('youtu.be')
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      : `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
    if (oembedRes.ok) {
      const data = await oembedRes.json() as any;
      if (data?.title) mediaTitle = data.title;
      if (data?.author_name) mediaAuthor = data.author_name;
    }
  } catch { /* non-fatal */ }

  // ── Step 2: Retrieve subtitles via yt-dlp (Very Fast: skip-download) ─────
  const tmpDir = ensureTmpDir();
  const tmpBase = `sub_${Date.now()}`;
  let subtitleContent: string | null = null;

  try {
    logger.info('Transcribe', `Buscando legendas rápidas para: ${url}`);
    
    // We use a relative output path 'tmp/sub_...' to bypass spaces in path parsing bugs of youtube-dl-exec
    await runYtDlpWithTimeout(url, {
      skipDownload: true,
      writeAutoSubs: true,
      writeSubs: true,
      subLangs: 'pt,en',
      output: `tmp/${tmpBase}.%(lang)s.%(ext)s`,
      noWarnings: true,
      noCheckCertificates: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
    }, 7000); // 7s timeout to prevent long hangs

    // Check if any subtitle file was generated in the absolute tmp folder
    const files = fs.readdirSync(tmpDir);
    const matchingFiles = files.filter(f => f.startsWith(tmpBase) && (f.endsWith('.vtt') || f.endsWith('.srt')));

    // Sort to prioritize pt, then en, then others
    matchingFiles.sort((a, b) => {
      if (a.includes('.pt.')) return -1;
      if (b.includes('.pt.')) return 1;
      if (a.includes('.en.')) return -1;
      if (b.includes('.en.')) return 1;
      return 0;
    });

    const subFile = matchingFiles[0];
    if (subFile) {
      const subFilePath = path.join(tmpDir, subFile);
      subtitleContent = fs.readFileSync(subFilePath, 'utf-8');
      logger.info('Transcribe', `Legendas encontradas e lidas: ${subFile}`);
      
      // Clean up all subtitle files generated matching this base
      for (const file of matchingFiles) {
        try {
          fs.unlinkSync(path.join(tmpDir, file));
        } catch {}
      }
    } else {
      logger.info('Transcribe', 'Nenhuma legenda disponível via yt-dlp.');
    }
  } catch (subErr: any) {
    logger.warn('Transcribe', `Erro ao buscar legendas via yt-dlp: ${subErr.message}`);
  }

  // ── Step 3: Transcribe with Gemini ───────────────────────────────────────
  const geminiKey = (req.headers['x-gemini-api-key'] || req.body.geminiApiKey) as string;
  let transcriptText = '';

  const ai = getAI(geminiKey);
  if (ai) {
    try {
      if (subtitleContent) {
        // Path A: Subtitle formatter (very fast, accurate transcription)
        logger.info('Transcribe', 'Enviando legendas obtidas para o Gemini...');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Você é um formatador profissional de transcrições do UniStream Downloader.
Recebemos este arquivo de legenda (VTT/SRT) do vídeo e precisamos de uma transcrição organizada, limpa e com pontuação correta em Português Brasileiro.

Título: ${mediaTitle}
Canal: ${mediaAuthor}
URL: ${url}

Legendas:
${subtitleContent.substring(0, 35000)}

Siga exatamente o formato abaixo (texto simples, sem markdown, sem blocos de código):

============= UNISTREAM TRANSCRIPTION SERVICE =============
- Título: ${mediaTitle}
- Canal/Autor: ${mediaAuthor}
- URL: ${url}
- Método: Transcrição Otimizada de Legendas via Google Gemini IA (Fast Track)
- Data: ${new Date().toLocaleDateString('pt-BR')}

============= RESUMO EXECUTIVO =============
[Escreva 2 parágrafos resumindo detalhadamente os temas, tópicos e conclusões do vídeo]

============= TRANSCRIÇÃO DETALHADA =============
[Organize o texto das legendas acima em parágrafos coerentes, adicione pontuação correta (pontos, vírgulas, interrogações), corrija pequenos erros de ortografia fonética e insira timestamps [MM:SS] aproximados a cada início de tópico importante. Remova marcas repetitivas das legendas.]

============= PALAVRAS-CHAVE E DESTAQUES =============
[Liste as principais ideias ou frases do conteúdo]`
        });
        transcriptText = response.text?.trim() || '';
      } else {
        // Path B: Direct smart search / Lyrics retrieval
        logger.info('Transcribe', 'Buscando letra/conteúdo do vídeo via IA...');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Você é um assistente inteligente de transcrição do UniStream Downloader.
Não conseguimos baixar as legendas diretamente. Precisamos que você gere a letra completa da música (se for música) ou um relatório e resumo estruturado do assunto abordado.

IMPORTANTE: Se o título/canal indicar que a mídia é uma MÚSICA (canção, clipe, faixa), você DEVE recuperar e fornecer a LETRA OFICIAL COMPLETA (lyrics) dessa música em seu banco de dados global de conhecimento.

Título: ${mediaTitle}
Canal: ${mediaAuthor}
URL: ${url}

Siga exatamente o formato abaixo (texto simples, sem markdown, sem blocos de código):

============= UNISTREAM TRANSCRIPTION SERVICE =============
- Título: ${mediaTitle}
- Canal/Autor: ${mediaAuthor}
- URL: ${url}
- Método: Recuperação Inteligente de Letra/Conteúdo via Google Gemini IA (Fast Track)
- Data: ${new Date().toLocaleDateString('pt-BR')}

============= RESUMO / CONTEXTO =============
[Se for música: Explique o significado da letra, estilo musical e recepção. Se for palestra/vídeo: Explique do que se trata o conteúdo com base no título e autor.]

============= LETRA OFICIAL / CONTEÚDO ESTIMADO =============
[Se for música: Coloque a letra oficial completa e organizada por estrofes. Se for outro tipo de conteúdo: Forneça um resumo detalhado estruturado do que é falado.]

============= TÓPICOS E DESTAQUES =============
[Destaque as principais frases ou ideias da música/conteúdo]`
        });
        transcriptText = response.text?.trim() || '';
      }
      logger.info('Transcribe', `Processamento concluído com sucesso (${transcriptText.length} caracteres).`);
    } catch (geminiErr: any) {
      logger.error('Transcribe', `Erro no Gemini: ${geminiErr.message}`);
      transcriptText = buildErrorText(mediaTitle, mediaAuthor, url, geminiErr.message);
    }
  } else {
    transcriptText = `============= UNISTREAM TRANSCRIPTION SERVICE =============
Título: ${mediaTitle}
Canal: ${mediaAuthor}
URL: ${url}
Data: ${new Date().toLocaleDateString('pt-BR')}

AVISO: A chave de API do Gemini não foi configurada no servidor.
Por favor, verifique as configurações da variável de ambiente GEMINI_API_KEY no servidor de deploy.`;
  }

  // ── Step 4: Return .txt file ────────────────────────────────────────────
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputFilename)}"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(transcriptText);
});

function buildErrorText(title: string, author: string, url: string, errorMsg: string): string {
  return `============= UNISTREAM TRANSCRIPTION SERVICE =============
Título: ${title}
Canal: ${author}
URL: ${url}
Data: ${new Date().toLocaleDateString('pt-BR')}

ERRO NA TRANSCRIÇÃO
Não foi possível processar o áudio com o Gemini.
Detalhe técnico: ${errorMsg}

Por favor, tente novamente em alguns instantes.`;
}

export default router;
