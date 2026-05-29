import { Platform, MediaInfo, DownloadFormat } from '../types';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
  ? 'https://unistreamdownloader.onrender.com'
  : '';

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

  /**
   * POST /api/transcribe — Real AI transcription.
   * Backend downloads the audio via yt-dlp, sends it to Gemini for genuine
   * speech-to-text, and streams back a .txt file.
   * Returns a blob URL for immediate download in the browser.
   */
  async transcribe(url: string, title: string): Promise<{ downloadUrl: string }> {
    const res = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title }),
    });
    if (!res.ok) {
      // Try to parse error JSON, fall back to status text
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    // Server responds with the .txt file directly — create a blob URL for <a> download
    const blob = await res.blob();
    const downloadUrl = URL.createObjectURL(blob);
    return { downloadUrl };
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
    return new EventSource(`${BASE_URL}${path}`);
  },
};

export default api;
