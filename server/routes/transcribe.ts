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

// ─── Lazy Gemini client ──────────────────────────────────────────────────────
let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!_ai && process.env.GEMINI_API_KEY) {
    try { _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); } catch { /* ignore */ }
  }
  return _ai;
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

  // ── Step 2: Download audio via yt-dlp ────────────────────────────────────
  const tmpDir = ensureTmpDir();
  const tmpBase = `transcribe_${Date.now()}`;
  const outputTemplate = path.join(tmpDir, `${tmpBase}.%(ext)s`);
  let audioFilePath: string | null = null;

  try {
    logger.info('Transcribe', `Baixando áudio de: ${url}`);
    await (youtubedl as any)(url, {
      format: 'bestaudio/best',
      output: outputTemplate,
      noWarnings: true,
      noCheckCertificates: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
      maxFilesize: '50m',   // safety cap — avoids OOM on Render free tier
    });

    // Locate the resulting file
    const files = fs.readdirSync(tmpDir);
    const found = files
      .filter(f => f.startsWith(tmpBase))
      .map(f => path.join(tmpDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    if (found.length > 0) {
      audioFilePath = found[0];
      logger.info('Transcribe', `Áudio baixado: ${path.basename(audioFilePath)}`);
    }
  } catch (dlErr: any) {
    logger.warn('Transcribe', `Falha ao baixar áudio: ${dlErr.message} — usando fallback de análise por texto`);
  }

  // ── Step 3: Transcribe with Gemini ───────────────────────────────────────
  const ai = getAI();
  let transcriptText = '';

  if (ai && audioFilePath && fs.existsSync(audioFilePath)) {
    // ── Path A: Real audio transcription ────────────────────────────────────
    try {
      const audioBuffer = fs.readFileSync(audioFilePath);
      const base64Audio = audioBuffer.toString('base64');
      const ext = (audioFilePath.split('.').pop() || 'webm').toLowerCase();
      const mimeType = MIME[ext] || 'audio/webm';

      logger.info('Transcribe', `Enviando ${Math.round(audioBuffer.length / 1024)}KB para Gemini (${mimeType})...`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Audio } },
              {
                text: `Você é um transcritor profissional de áudio e vídeo. Transcreva com precisão TUDO o que é dito neste áudio, em Português Brasileiro.

Siga este formato (texto simples, sem markdown, sem blocos de código):

============= UNISTREAM TRANSCRIPTION SERVICE =============
- Título: ${mediaTitle}
- Canal/Autor: ${mediaAuthor}
- URL: ${url}
- Método: Transcrição Real de Áudio via Google Gemini AI
- Data: ${new Date().toLocaleDateString('pt-BR')}

============= RESUMO EXECUTIVO =============
[Escreva 2-3 parágrafos resumindo os principais temas, argumentos e conclusões do conteúdo]

============= TRANSCRIÇÃO COMPLETA =============
[Transcreva palavra por palavra tudo que foi dito. Use timestamps [MM:SS] a cada mudança de assunto ou a cada 30 segundos. Identifique os falantes quando possível, ex: "Apresentador:", "Entrevistado:". Use [Música] para trechos instrumentais e [inaudível] para trechos incompreensíveis. Não invente nenhum conteúdo.]

============= PALAVRAS-CHAVE E DESTAQUES =============
[Liste as 5-10 principais ideias, frases marcantes e conclusões do conteúdo]`
              }
            ]
          }
        ]
      });

      transcriptText = response.text?.trim() || '';
      logger.info('Transcribe', `Transcrição real concluída (${transcriptText.length} chars).`);
    } catch (geminiErr: any) {
      logger.error('Transcribe', `Erro no Gemini: ${geminiErr.message}`);
      transcriptText = buildErrorText(mediaTitle, mediaAuthor, url, geminiErr.message);
    } finally {
      cleanupFile(audioFilePath);
    }
  } else if (ai) {
    // ── Path B: Fallback — text-only analysis (clearly labeled) ─────────────
    logger.info('Transcribe', 'Áudio indisponível — gerando análise de conteúdo por metadados.');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analise o vídeo abaixo e gere um relatório de análise de conteúdo. DEIXE CLARO que esta é uma análise por IA baseada nos metadados do vídeo, NÃO uma transcrição real do áudio.

Título: ${mediaTitle}
Canal: ${mediaAuthor}
URL: ${url}
Data: ${new Date().toLocaleDateString('pt-BR')}

Formate em texto simples, sem markdown:

============= UNISTREAM - ANÁLISE DE CONTEÚDO POR IA =============
- Título: ${mediaTitle}
- Canal: ${mediaAuthor}
- URL: ${url}
- Data: ${new Date().toLocaleDateString('pt-BR')}
- AVISO: Análise por IA com base nos metadados. O áudio não pôde ser baixado automaticamente nesta sessão.

============= ANÁLISE DO CONTEÚDO =============
[Analise o que o vídeo provavelmente aborda com base no título e no canal]

============= TÓPICOS PROVÁVEIS =============
[Liste os temas e pontos que provavelmente são abordados no vídeo]

============= OBSERVAÇÃO TÉCNICA =============
Para obter a transcrição real do áudio, certifique-se de que o servidor tem acesso ao yt-dlp e à variável GEMINI_API_KEY configurada.`
      });
      transcriptText = response.text?.trim() || 'Falha ao gerar análise.';
    } catch {
      transcriptText = buildErrorText(mediaTitle, mediaAuthor, url, 'Falha na análise de conteúdo');
    }
  } else {
    transcriptText = `============= UNISTREAM TRANSCRIPTION SERVICE =============
Título: ${mediaTitle}
Canal: ${mediaAuthor}
URL: ${url}
Data: ${new Date().toLocaleDateString('pt-BR')}

AVISO: A chave GEMINI_API_KEY não está configurada no servidor.
Configure a variável de ambiente GEMINI_API_KEY para habilitar a transcrição por IA.`;
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
