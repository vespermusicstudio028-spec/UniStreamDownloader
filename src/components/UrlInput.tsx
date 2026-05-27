import React, { useState, useRef, useCallback } from 'react';
import { Link2, Clipboard, Loader2, Search } from 'lucide-react';
import { MediaInfo } from '../types';
import api from '../services/api';

interface UrlInputProps {
  onInfoLoaded: (url: string, info: MediaInfo) => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '▶',
  instagram: '📷',
  tiktok: '♪',
  facebook: 'f',
  twitter: '𝕏',
  x: '𝕏',
  kwai: '◉',
  vimeo: '▲',
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ff4444',
  instagram: '#e1306c',
  tiktok: '#69c9d0',
  facebook: '#4080ff',
  twitter: '#1da1f2',
  x: '#1da1f2',
  kwai: '#ff6800',
  vimeo: '#1ab7ea',
};

function detectPlatformFromUrl(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('kwai.com')) return 'kwai';
  if (url.includes('vimeo.com')) return 'vimeo';
  return '';
}

export default function UrlInput({ onInfoLoaded, onError, loading, setLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setPlatform(detectPlatformFromUrl(val));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setPlatform(detectPlatformFromUrl(text));
      if (text.startsWith('http')) {
        setTimeout(() => handleAnalyze(text), 100);
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleAnalyze = async (targetUrl = url) => {
    const clean = targetUrl.trim();
    if (!clean) {
      onError('Cole um link válido para analisar.');
      return;
    }
    if (!clean.startsWith('http')) {
      onError('O link deve começar com http:// ou https://');
      return;
    }

    setLoading(true);
    try {
      const info = await api.info(clean);
      onInfoLoaded(clean, info);
    } catch (err: any) {
      onError(err.message || 'Não foi possível analisar este link.');
    } finally {
      setLoading(false);
    }
  };

  const platformColor = PLATFORM_COLORS[platform] || 'var(--cyan)';
  const platformIcon = PLATFORM_ICONS[platform];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ position: 'relative' }}>
        {/* URL Input */}
        <div
          className="glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            padding: '6px 6px 6px 16px',
            borderRadius: 'var(--radius-xl)',
            border: url ? `1.5px solid rgba(6,182,212,0.3)` : '1.5px solid var(--border)',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            boxShadow: url ? '0 0 0 3px rgba(6,182,212,0.08)' : 'none',
          }}
        >
          {/* Platform icon or default */}
          <div style={{
            marginRight: '10px',
            fontSize: '1.1rem',
            color: platformColor,
            width: 24,
            textAlign: 'center',
            flexShrink: 0,
            transition: 'color 0.3s ease',
          }}>
            {platformIcon ? platformIcon : <Link2 size={18} color="var(--text-muted)" />}
          </div>

          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Cole aqui o link do vídeo (YouTube, Instagram, TikTok...)"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.925rem',
              fontFamily: 'Inter, sans-serif',
              padding: '8px 0',
            }}
          />

          {/* Paste button */}
          <button
            onClick={handlePaste}
            className="btn btn-ghost btn-sm"
            title="Colar da área de transferência"
            style={{ flexShrink: 0, gap: 4 }}
          >
            <Clipboard size={14} />
            <span style={{ display: 'none' }}>Colar</span>
          </button>

          {/* Analyze button */}
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !url.trim()}
            className="btn btn-primary"
            style={{ flexShrink: 0, borderRadius: 'var(--radius-lg)', minWidth: 120 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Search size={16} />
                Analisar
              </>
            )}
          </button>
        </div>

        {/* Hint */}
        {!url && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginTop: '10px',
          }}>
            Pressione Enter ou clique em "Analisar" para detectar o vídeo automaticamente
          </p>
        )}
      </div>
    </div>
  );
}
