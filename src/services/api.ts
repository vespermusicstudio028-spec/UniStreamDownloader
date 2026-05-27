import { Platform, MediaInfo, DownloadFormat } from '../types';

const BASE_URL = '';

export const api = {
  /** POST /api/info — Extract metadata for a URL */
  async info(url: string): Promise<MediaInfo> {
    const res = await fetch(`${BASE_URL}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao analisar URL' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /** POST /api/download — Start a video download job */
  async startDownload(params: {
    url: string;
    quality: string;
    format: string;
    title: string;
  }): Promise<{ jobId: string }> {
    const res = await fetch(`${BASE_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao iniciar download' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /** POST /api/mp3 — Start an MP3 conversion job */
  async startMp3(params: {
    url: string;
    bitrate: number;
    title: string;
    artist?: string;
  }): Promise<{ jobId: string }> {
    const res = await fetch(`${BASE_URL}/api/mp3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao iniciar MP3' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /** POST /api/transcribe — Transcribe audio to text */
  async transcribe(url: string, title: string): Promise<{ downloadUrl: string }> {
    const res = await fetch(`${BASE_URL}/api/get-stream-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format: 'txt', filename: title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na transcrição' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /** POST /api/get-stream-url — Legacy route for Cobalt streaming URL */
  async getStreamUrl(params: {
    url: string;
    format: string;
    quality: string;
    filename?: string;
  }): Promise<{ status: string; downloadUrl: string }> {
    const res = await fetch(`${BASE_URL}/api/get-stream-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /** SSE subscription for job progress */
  subscribeProgress(jobId: string, type: 'download' | 'mp3' = 'download'): EventSource {
    const path = type === 'mp3' ? `/api/mp3/progress/${jobId}` : `/api/download/progress/${jobId}`;
    return new EventSource(path);
  },
};

export default api;
