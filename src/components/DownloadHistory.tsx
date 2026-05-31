import React, { useState } from 'react';
import {
  Download, Star, Trash2, Copy, Share2, RefreshCw, Clock, BarChart3, ListFilter, Play, FileText, Monitor, Music
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

type TabType = 'list' | 'stats';
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
  const [activeTab, setActiveTab] = useState<TabType>('list');
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

  // ── Stats Calculations ─────────────────────────────────────────────────────
  const totalDownloads = jobs.filter(j => j.status === 'done').length;
  
  const platformCounts = jobs.reduce((acc, job) => {
    const p = job.platform || 'web';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatCounts = jobs.reduce((acc, job) => {
    const f = job.format || 'mp4';
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Most downloaded files (grouped by title)
  const titleCounts = jobs.reduce((acc, job) => {
    acc[job.title] = (acc[job.title] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDownloaded = Object.entries(titleCounts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div style={{ maxWidth: 680, margin: '40px auto 80px', padding: '0 16px' }} className="animate-slide-up">
      {/* Top Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '12px 4px',
              background: 'none',
              border: 'none',
              color: activeTab === 'list' ? 'var(--cyan)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'list' ? '2px solid var(--cyan)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Clock size={15} />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '12px 4px',
              background: 'none',
              border: 'none',
              color: activeTab === 'stats' ? 'var(--cyan)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'stats' ? '2px solid var(--cyan)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <BarChart3 size={15} />
            Estatísticas
          </button>
        </div>

        <button onClick={onClear} className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)', fontSize: '0.78rem' }}>
          <Trash2 size={12} />
          Limpar Tudo
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filters Row */}
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

          {/* Job cards list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px', fontSize: '0.875rem' }}>
                Nenhum download nesta categoria.
              </div>
            ) : (
              filtered.map((job) => (
                <div key={job.id} style={{ position: 'relative' }}>
                  <DownloadCard job={job} onUpdate={onUpdate} onSave={onSave} />

                  {/* Actions footer under the card */}
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
                      title="Copiar link original"
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
                    <button
                      onClick={() => onDelete(job.id)}
                      className="btn btn-ghost btn-sm"
                      title="Remover do histórico"
                      style={{ color: 'var(--rose)', fontSize: '0.75rem' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Stats Tab View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
          {/* High-level cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass" style={{ padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total de Conversões</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--cyan)', marginTop: 4 }}>
                {totalDownloads}
              </div>
            </div>
            <div className="glass" style={{ padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No Histórico</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--indigo-light)', marginTop: 4 }}>
                {jobs.length}
              </div>
            </div>
          </div>

          {/* Formats and platforms */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 12 }}>
                Formatos Convertidos
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(formatCounts).map(([format, count]) => (
                  <div key={format} style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', flex: 1 }}>{format}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
                {Object.keys(formatCounts).length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum dado</span>
                )}
              </div>
            </div>

            <div className="glass" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 12 }}>
                Plataformas de Mídia
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(platformCounts).map(([platform, count]) => (
                  <div key={platform} style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', flex: 1 }}>{platform}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
                {Object.keys(platformCounts).length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum dado</span>
                )}
              </div>
            </div>
          </div>

          {/* Top Downloaded Files */}
          <div className="glass" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 12 }}>
              Arquivos Mais Convertidos
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topDownloaded.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem' }}>
                  <span className="badge badge-cyan" style={{ width: 22, height: 22, justifyContent: 'center', padding: 0 }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {item.title}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--cyan)' }}>{item.count}x</span>
                </div>
              ))}
              {topDownloaded.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum download concluído.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
