import React, { useState } from 'react';
import {
  Download, Star, Trash2, Copy, Share2, RefreshCw, Clock, Filter
} from 'lucide-react';
import { DownloadJob, DownloadFormat } from '../types';
import DownloadCard from './DownloadCard';

interface DownloadHistoryProps {
  jobs: DownloadJob[];
  onUpdate: (id: string, updates: Partial<DownloadJob>) => void;
  onSave: (job: DownloadJob) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClear: () => void;
  favorites: string[];
}

type FilterType = 'all' | 'favorites' | 'mp4' | 'mp3' | 'txt';

export default function DownloadHistory({
  jobs,
  onUpdate,
  onSave,
  onDelete,
  onToggleFavorite,
  onClear,
  favorites,
}: DownloadHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  if (jobs.length === 0) return null;

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: '📋 Todos' },
    { id: 'favorites', label: '⭐ Favoritos' },
    { id: 'mp4', label: '🎬 MP4' },
    { id: 'mp3', label: '🎵 MP3' },
    { id: 'txt', label: '📝 Texto' },
  ];

  const filtered = jobs.filter((j) => {
    if (filter === 'favorites') return favorites.includes(j.id);
    if (filter === 'mp4') return j.format === 'mp4';
    if (filter === 'mp3') return j.format === 'mp3';
    if (filter === 'txt') return j.format === 'txt';
    return true;
  });

  const handleCopyLink = async (job: DownloadJob) => {
    try {
      await navigator.clipboard.writeText(job.url);
    } catch {
      // fallback
    }
  };

  const handleShare = async (job: DownloadJob) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, url: job.url });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink(job);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '40px auto 80px', padding: '0 16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={16} color="var(--cyan)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Histórico de Downloads
          </h2>
          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
            {jobs.length}
          </span>
        </div>
        <button onClick={onClear} className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)', fontSize: '0.78rem' }}>
          <Trash2 size={12} />
          Limpar
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`quality-btn ${filter === f.id ? 'selected' : ''}`}
            style={{ fontSize: '0.78rem' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px', fontSize: '0.875rem' }}>
            Nenhum download nesta categoria.
          </div>
        ) : (
          filtered.map((job) => (
            <div key={job.id} style={{ position: 'relative' }}>
              <DownloadCard job={job} onUpdate={onUpdate} onSave={onSave} />

              {/* Action buttons row */}
              <div style={{
                display: 'flex',
                gap: '6px',
                justifyContent: 'flex-end',
                marginTop: '6px',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => onToggleFavorite(job.id)}
                  className="btn btn-ghost btn-sm"
                  title={favorites.includes(job.id) ? 'Remover dos favoritos' : 'Favoritar'}
                  style={{ color: favorites.includes(job.id) ? '#f59e0b' : 'var(--text-muted)', fontSize: '0.75rem' }}
                >
                  <Star size={12} fill={favorites.includes(job.id) ? '#f59e0b' : 'none'} />
                </button>
                <button
                  onClick={() => handleCopyLink(job)}
                  className="btn btn-ghost btn-sm"
                  title="Copiar link"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => handleShare(job)}
                  className="btn btn-ghost btn-sm"
                  title="Compartilhar"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Share2 size={12} />
                </button>
                {job.status === 'done' && (
                  <button
                    onClick={() => onSave(job)}
                    className="btn btn-ghost btn-sm"
                    title="Baixar novamente"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
                <button
                  onClick={() => onDelete(job.id)}
                  className="btn btn-ghost btn-sm"
                  title="Remover"
                  style={{ color: 'var(--rose)', fontSize: '0.75rem' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
