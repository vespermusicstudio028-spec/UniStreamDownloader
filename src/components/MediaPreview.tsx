import React, { useState } from 'react';
import { Clock, User, Monitor, Music, FileText, ChevronDown } from 'lucide-react';
import { MediaInfo, DownloadFormat } from '../types';
import api from '../services/api';

interface MediaPreviewProps {
  url: string;
  info: MediaInfo;
  onStartDownload: (params: {
    format: DownloadFormat;
    quality: string;
    bitrate: number;
  }) => void;
  downloading: boolean;
}

const FORMAT_OPTIONS = [
  {
    id: 'mp4' as DownloadFormat,
    icon: Monitor,
    label: 'Vídeo MP4',
    desc: 'Alta qualidade, compatível com tudo',
    color: '#06b6d4',
  },
  {
    id: 'mp3' as DownloadFormat,
    icon: Music,
    label: 'Áudio MP3',
    desc: 'Somente o áudio, ideal para músicas',
    color: '#6366f1',
  },
  {
    id: 'txt' as DownloadFormat,
    icon: FileText,
    label: 'Texto (IA)',
    desc: 'Transcrição + resumo com inteligência artificial',
    color: '#10b981',
  },
];

const VIDEO_QUALITIES = ['1080p Full HD', '720p HD', '480p', '360p'];
const AUDIO_BITRATES = ['320kbps', '256kbps', '192kbps', '128kbps'];

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MediaPreview({ url, info, onStartDownload, downloading }: MediaPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState('1080p Full HD');
  const [selectedBitrate, setSelectedBitrate] = useState(320);
  const [imgError, setImgError] = useState(false);

  const handleDownload = () => {
    onStartDownload({
      format: selectedFormat,
      quality: selectedQuality,
      bitrate: selectedBitrate,
    });
  };

  const qualityLabel = selectedQuality.split(' ')[0];

  return (
    <div className="glass glass-hover animate-slide-up" style={{
      maxWidth: 680,
      margin: '24px auto 0',
      padding: '0',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
    }}>
      {/* Thumbnail + Info header */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Thumbnail */}
        <div style={{
          width: 140,
          minHeight: 90,
          flexShrink: 0,
          background: 'rgba(15,23,42,0.8)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {info.thumbnailUrl && !imgError ? (
            <img
              src={info.thumbnailUrl}
              alt={info.title}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              minHeight: 90,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(99,102,241,0.1))',
            }}>
              <Monitor size={32} color="var(--text-muted)" />
            </div>
          )}
          {/* Platform badge overlay */}
          <div style={{
            position: 'absolute',
            top: 6,
            left: 6,
            padding: '2px 7px',
            background: 'rgba(0,0,0,0.75)',
            borderRadius: '999px',
            fontSize: '0.65rem',
            color: '#fff',
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>
            {info.platform}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '14px 16px', overflow: 'hidden' }}>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
            marginBottom: '8px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {info.title}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {info.uploader && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={12} /> {info.uploader}
              </span>
            )}
            {info.duration > 0 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {formatDuration(info.duration)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Format selector */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Formato de download
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`format-card ${selectedFormat === fmt.id ? 'selected' : ''}`}
              style={{
                '--fmt-color': fmt.color,
                borderColor: selectedFormat === fmt.id ? fmt.color : undefined,
                boxShadow: selectedFormat === fmt.id ? `0 0 15px rgba(${hexToRgbStr(fmt.color)}, 0.2)` : undefined,
              } as any}
            >
              <fmt.icon size={18} style={{ color: selectedFormat === fmt.id ? fmt.color : 'var(--text-muted)', marginBottom: 6 }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedFormat === fmt.id ? fmt.color : 'var(--text-primary)' }}>
                {fmt.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {fmt.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Quality sub-selector */}
        {selectedFormat === 'mp4' && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Resolução
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {VIDEO_QUALITIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuality(q)}
                  className={`quality-btn ${selectedQuality === q ? 'selected' : ''}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedFormat === 'mp3' && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Qualidade do áudio
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {AUDIO_BITRATES.map((b) => {
                const bNum = parseInt(b);
                return (
                  <button
                    key={b}
                    onClick={() => setSelectedBitrate(bNum)}
                    className={`quality-btn ${selectedBitrate === bNum ? 'selected' : ''}`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: '16px', borderRadius: 'var(--radius)' }}
        >
          {downloading ? (
            <><span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span> Iniciando...</>
          ) : selectedFormat === 'txt' ? (
            '🤖 Transcrever com IA'
          ) : selectedFormat === 'mp3' ? (
            `⬇️ Baixar MP3 ${selectedBitrate}kbps`
          ) : (
            `⬇️ Baixar MP4 ${qualityLabel}`
          )}
        </button>
      </div>
    </div>
  );
}

function hexToRgbStr(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
