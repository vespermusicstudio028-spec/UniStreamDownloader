import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link2, Clipboard, Loader2, Search, CheckCircle2 } from 'lucide-react';
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
  youtu: '▶',
  instagram: '📷',
  tiktok: '♪',
  facebook: 'f',
  twitter: '𝕏',
  'x.com': '𝕏',
  kwai: '◉',
  vimeo: '▲',
  reddit: '◈',
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ff4444',
  youtu: '#ff4444',
  instagram: '#e1306c',
  tiktok: '#69c9d0',
  facebook: '#4080ff',
  twitter: '#1da1f2',
  'x.com': '#1da1f2',
  kwai: '#ff6800',
  vimeo: '#1ab7ea',
  reddit: '#ff4500',
};

function formatAndValidateUrl(input: string): string | null {
  const clean = input.trim();
  if (!clean) return null;

  // 1. If it's already a valid http/https URL, return it
  try {
    const u = new URL(clean);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return clean;
    }
  } catch {}

  // 2. Handle YouTube video ID (11 chars, e.g. "PMn3HWONYDM")
  const ytIdRegex = /^[a-zA-Z0-9_-]{11}$/;
  if (ytIdRegex.test(clean)) {
    return `https://www.youtube.com/watch?v=${clean}`;
  }

  // 3. Handle query string only pasted from YouTube (e.g. "v=PMn3HWONYDM...")
  if (clean.startsWith('v=')) {
    const match = clean.match(/v=([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
  }

  // 4. Handle domains without protocol (e.g. "youtube.com/...", "x.com/...", etc.)
  const domainRegex = /^(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|kwai\.com|vimeo\.com|reddit\.com)(\/.*)?$/i;
  if (domainRegex.test(clean)) {
    return `https://${clean}`;
  }

  // 5. Handle www. domains without protocol
  if (clean.toLowerCase().startsWith('www.')) {
    return `https://${clean}`;
  }

  return null;
}

function detectPlatformKey(url: string): string {
  const formatted = formatAndValidateUrl(url) || url;
  const lower = formatted.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'x.com';
  if (lower.includes('kwai.com')) return 'kwai';
  if (lower.includes('vimeo.com')) return 'vimeo';
  if (lower.includes('reddit.com')) return 'reddit';
  return '';
}

function isValidUrl(str: string): boolean {
  return formatAndValidateUrl(str) !== null;
}

export default function UrlInput({ onInfoLoaded, onError, loading, setLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core analyze function
  const analyze = useCallback(async (targetUrl: string) => {
    const formatted = formatAndValidateUrl(targetUrl);
    if (!formatted) return;
    if (loading) return;

    setLoading(true);
    setAnalyzed(false);
    try {
      const info = await api.info(formatted);
      setAnalyzed(true);
      setUrl(formatted);
      onInfoLoaded(formatted, info);
    } catch (err: any) {
      onError(err.message || 'Não foi possível analisar este link. Verifique se é público e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [loading, onInfoLoaded, onError, setLoading]);

  // Auto-analyze when a valid URL is typed/pasted — debounced 800ms
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setAnalyzed(false);
    setPlatform(detectPlatformKey(val));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (isValidUrl(val)) {
      debounceRef.current = setTimeout(() => {
        analyze(val);
      }, 300);
    }
  };

  // Paste button — auto-analyze immediately
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      setUrl(trimmed);
      setPlatform(detectPlatformKey(trimmed));
      setAnalyzed(false);
      if (isValidUrl(trimmed)) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // Tiny delay so UI updates first
        setTimeout(() => analyze(trimmed), 100);
      }
    } catch {
      inputRef.current?.focus();
      onError('Não foi possível acessar a área de transferência. Cole o link manualmente.');
    }
  };

  // Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      analyze(url);
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const platformColor = PLATFORM_COLORS[platform] || 'var(--cyan)';
  const platformIcon = PLATFORM_ICONS[platform];
  const hasValidUrl = isValidUrl(url);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
      <div
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '6px 6px 6px 16px',
          borderRadius: 'var(--radius-xl)',
          border: loading
            ? '1.5px solid rgba(6,182,212,0.5)'
            : analyzed
            ? '1.5px solid rgba(16,185,129,0.5)'
            : hasValidUrl
            ? '1.5px solid rgba(6,182,212,0.3)'
            : '1.5px solid var(--border)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          boxShadow: loading
            ? '0 0 0 3px rgba(6,182,212,0.12)'
            : analyzed
            ? '0 0 0 3px rgba(16,185,129,0.1)'
            : 'none',
        }}
      >
        {/* Platform icon or default link icon */}
        <div style={{
          marginRight: '10px',
          fontSize: '1.1rem',
          color: platformIcon ? platformColor : 'var(--text-muted)',
          width: 24,
          textAlign: 'center',
          flexShrink: 0,
          transition: 'color 0.3s ease',
        }}>
          {analyzed
            ? <CheckCircle2 size={18} color="var(--emerald)" />
            : platformIcon
            ? <span>{platformIcon}</span>
            : <Link2 size={18} />
          }
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Cole aqui o link do vídeo — análise automática!"
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
          disabled={loading}
          className="btn btn-ghost btn-sm"
          title="Colar e analisar automaticamente"
          style={{ flexShrink: 0, gap: 4 }}
        >
          <Clipboard size={14} />
        </button>

        {/* Analyze button (manual fallback) */}
        <button
          onClick={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            analyze(url);
          }}
          disabled={loading || !hasValidUrl}
          className="btn btn-primary"
          style={{ flexShrink: 0, borderRadius: 'var(--radius-lg)', minWidth: 110 }}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Analisando...
            </>
          ) : analyzed ? (
            <>
              <CheckCircle2 size={15} />
              Analisado!
            </>
          ) : (
            <>
              <Search size={15} />
              Analisar
            </>
          )}
        </button>
      </div>

      {/* Hint text */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: '8px',
      }}>
        {loading
          ? '🔍 Analisando o link automaticamente...'
          : analyzed
          ? '✅ Vídeo detectado! Escolha o formato abaixo.'
          : 'Cole um link — a análise começa automaticamente. Pressione Enter para forçar.'}
      </p>
    </div>
  );
}
