import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Download, Monitor, Music, FileText, Loader2 } from 'lucide-react';
import { DownloadJob } from '../types';
import { useSSE } from '../hooks/useSSE';

interface DownloadCardProps {
  job: DownloadJob;
  onUpdate: (id: string, updates: Partial<DownloadJob>) => void;
  onSave: (job: DownloadJob) => void;
}

const STATUS_LABELS: Record<string, string> = {
  queued: '📋 Na fila...',
  downloading: '⬇️ Baixando...',
  converting: '⚙️ Convertendo...',
  finalizing: '✨ Finalizando...',
  done: '✅ Concluído!',
  error: '❌ Falha',
};

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  mp4: <Monitor size={14} />,
  mp3: <Music size={14} />,
  txt: <FileText size={14} />,
};

export default function DownloadCard({ job, onUpdate, onSave }: DownloadCardProps) {
  const [confetti, setConfetti] = useState(false);
  const isDone = job.status === 'done';
  const isError = job.status === 'error';
  const isActive = !isDone && !isError;

  // SSE subscription to real progress
  const sseUrl = isActive && job.id
    ? (job.format === 'mp3' ? `/api/mp3/progress/${job.id}` : `/api/download/progress/${job.id}`)
    : null;

  useSSE(sseUrl, {
    onMessage: (data) => {
      if (!data) return;
      const updates: Partial<DownloadJob> = {
        status: data.status,
        progress: data.progress ?? job.progress,
        speed: data.speed ?? '',
        eta: data.eta ?? '',
        message: data.message ?? '',
      };
      if (data.filePath) updates.filePath = data.filePath;
      if (data.filename) updates.filename = data.filename;
      if (data.error) updates.error = data.error;
      onUpdate(job.id, updates);

      if (data.status === 'done' && !confetti) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2000);
      }
    },
  });

  const statusLabel = STATUS_LABELS[job.status] || job.status;
  const barColor = isError ? 'var(--rose)' : isDone ? 'var(--emerald)' : 'var(--cyan)';

  return (
    <div
      className={`glass glass-hover download-card-${job.status} animate-slide-up`}
      style={{
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease',
      }}
    >
      {/* Confetti animation overlay */}
      {confetti && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left: `${(i / 12) * 100}%`,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: ['#06b6d4', '#6366f1', '#10b981', '#f59e0b'][i % 4],
                animation: `confetti-fall ${0.8 + Math.random() * 0.8}s ease forwards`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Thumbnail */}
        {job.thumbnailUrl ? (
          <img
            src={job.thumbnailUrl}
            alt={job.title}
            style={{
              width: 56,
              height: 40,
              objectFit: 'cover',
              borderRadius: 8,
              flexShrink: 0,
            }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: 56,
            height: 40,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {FORMAT_ICONS[job.format] || <Monitor size={16} color="var(--text-muted)" />}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + format badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {job.title}
            </span>
            <span className={`badge badge-${job.format === 'mp3' ? 'indigo' : job.format === 'txt' ? 'emerald' : 'cyan'}`}
              style={{ flexShrink: 0, fontSize: '0.7rem' }}>
              {FORMAT_ICONS[job.format]}
              {job.format.toUpperCase()}
              {job.quality ? ` ${job.quality.split('p')[0]}p` : ''}
            </span>
          </div>

          {/* Progress bar */}
          {isActive && (
            <div className="progress-track" style={{ marginBottom: 6 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${job.progress}%`,
                  background: `linear-gradient(90deg, var(--cyan-dark), var(--cyan))`,
                }}
              />
            </div>
          )}

          {/* Status + meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
            <span style={{
              fontSize: '0.75rem',
              color: isError ? 'var(--rose)' : isDone ? 'var(--emerald)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {isActive && <Loader2 size={11} className="animate-spin" />}
              {isError ? (job.error || 'Falha no download') : (job.message || statusLabel)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isActive && job.speed && (
                <span style={{ fontSize: '0.72rem', color: 'var(--cyan)', fontFamily: 'monospace' }}>
                  {job.speed}
                </span>
              )}
              {isActive && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {job.progress}%
                </span>
              )}
              {isDone && (
                <button
                  onClick={() => onSave(job)}
                  className="btn btn-primary btn-sm"
                  style={{ gap: 4, fontSize: '0.78rem' }}
                >
                  <Download size={12} />
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
