import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Clock, Download, Zap, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusData {
  status: string;
  timestamp: string;
  uptime: string;
  uptimeSeconds: number;
  responseTime: number;
  services: {
    api: { status: string; label: string };
    ffmpeg: { status: string; label: string; path: string | null };
    cache: { status: string; label: string; entries: number };
  };
  system: {
    memory: { total: string; used: string; free: string; percent: number };
    process: { heapUsed: string; heapTotal: string; rss: string };
    cpu: { model: string; cores: number; loadAvg: string[] };
    platform: string;
    nodeVersion: string;
  };
  jobs: {
    active: number;
    totalDownloads: number;
    requestCount: number;
  };
}

function StatusIndicator({ status }: { status: string }) {
  const isOnline = status === 'online';
  return (
    <span
      className={`status-dot ${isOnline ? 'status-dot-online' : 'status-dot-offline'}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}

function ServiceCard({ icon: Icon, label, status, detail }: {
  icon: React.ElementType;
  label: string;
  status: string;
  detail?: string;
}) {
  const isOnline = status === 'online';
  return (
    <div className={`status-service-card ${isOnline ? 'status-service-online' : 'status-service-offline'}`}>
      <div className="status-service-header">
        <div className="status-service-icon">
          <Icon size={20} />
        </div>
        <div className="status-service-info">
          <span className="status-service-label">{label}</span>
          {detail && <span className="status-service-detail">{detail}</span>}
        </div>
        <div className="status-service-badge">
          {isOnline ? <CheckCircle size={16} color="var(--emerald)" /> : <XCircle size={16} color="var(--rose)" />}
          <span style={{ color: isOnline ? 'var(--emerald)' : 'var(--rose)', fontSize: '0.75rem', fontWeight: 600 }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}

function CircularProgress({ percent, label, color }: { percent: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ - (percent / 100) * circ;

  return (
    <div className="circular-progress-wrapper">
      <svg width="100" height="100" className="circular-progress-svg">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="circular-progress-label">
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{percent}%</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const apiBase = (import.meta as any).env.VITE_API_BASE || '';

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/api/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-page">
      <div className="status-page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif' }}>
            Status do Sistema
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.9rem' }}>
            Monitoramento em tempo real dos serviços UniStream Pro
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setLoading(true); fetchStatus(); }}
          title="Atualizar"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {lastUpdated && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 24 }}>
          Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')} · Atualiza automaticamente a cada 10s
        </p>
      )}

      {error && (
        <div className="status-error-card">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="status-loading">
          <div className="spinner" />
          <span>Carregando status...</span>
        </div>
      )}

      {data && (
        <>
          {/* Services Grid */}
          <section className="status-section">
            <h2 className="status-section-title">Serviços</h2>
            <div className="status-services-grid">
              <ServiceCard
                icon={Activity}
                label="API REST"
                status={data.services.api.status}
                detail={`${data.responseTime}ms de resposta`}
              />
              <ServiceCard
                icon={Zap}
                label="FFmpeg (Conversor)"
                status={data.services.ffmpeg.status}
                detail="MP3 CBR 128kbps"
              />
              <ServiceCard
                icon={HardDrive}
                label="Cache"
                status={data.services.cache.status}
                detail={`${data.services.cache.entries} entradas`}
              />
              <ServiceCard
                icon={Download}
                label="yt-dlp (Download)"
                status="online"
                detail="YouTube, Instagram, TikTok..."
              />
            </div>
          </section>

          {/* System Metrics */}
          <section className="status-section">
            <h2 className="status-section-title">Métricas do Sistema</h2>
            <div className="status-metrics-grid">
              {/* Memory gauge */}
              <div className="status-metric-card">
                <h3 className="status-metric-title">Memória</h3>
                <CircularProgress
                  percent={data.system.memory.percent}
                  label="RAM"
                  color={data.system.memory.percent > 85 ? 'var(--rose)' : data.system.memory.percent > 65 ? 'var(--amber)' : 'var(--cyan)'}
                />
                <div className="status-metric-details">
                  <span>Usada: <strong>{data.system.memory.used}</strong></span>
                  <span>Total: <strong>{data.system.memory.total}</strong></span>
                  <span>Livre: <strong>{data.system.memory.free}</strong></span>
                </div>
              </div>

              {/* CPU Info */}
              <div className="status-metric-card">
                <h3 className="status-metric-title">CPU</h3>
                <div className="status-cpu-info">
                  <Cpu size={32} color="var(--indigo)" />
                  <span className="status-cpu-cores">{data.system.cpu.cores} núcleos</span>
                </div>
                <div className="status-metric-details">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {data.system.cpu.model}
                  </span>
                  <span>Load: <strong>{data.system.cpu.loadAvg[0]}</strong></span>
                </div>
              </div>

              {/* Uptime */}
              <div className="status-metric-card">
                <h3 className="status-metric-title">Uptime</h3>
                <div className="status-uptime">
                  <Clock size={32} color="var(--emerald)" />
                  <span className="status-uptime-value">{data.uptime}</span>
                </div>
                <div className="status-metric-details">
                  <span>Node: <strong>{data.system.nodeVersion}</strong></span>
                  <span>Plataforma: <strong>{data.system.platform}</strong></span>
                </div>
              </div>

              {/* Jobs / Requests */}
              <div className="status-metric-card">
                <h3 className="status-metric-title">Atividade</h3>
                <div className="status-jobs">
                  <div className="status-job-stat">
                    <span className="status-job-number" style={{ color: 'var(--cyan)' }}>
                      {data.jobs.active}
                    </span>
                    <span className="status-job-label">Jobs Ativos</span>
                  </div>
                  <div className="status-job-stat">
                    <span className="status-job-number" style={{ color: 'var(--emerald)' }}>
                      {data.jobs.totalDownloads}
                    </span>
                    <span className="status-job-label">Downloads</span>
                  </div>
                  <div className="status-job-stat">
                    <span className="status-job-number" style={{ color: 'var(--amber)' }}>
                      {data.jobs.requestCount}
                    </span>
                    <span className="status-job-label">Requisições</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Process Memory */}
          <section className="status-section">
            <h2 className="status-section-title">Memória do Processo Node.js</h2>
            <div className="status-process-grid">
              {[
                { label: 'Heap Usada', value: data.system.process.heapUsed, color: 'var(--cyan)' },
                { label: 'Heap Total', value: data.system.process.heapTotal, color: 'var(--indigo)' },
                { label: 'RSS', value: data.system.process.rss, color: 'var(--emerald)' },
              ].map((item) => (
                <div key={item.label} className="status-process-item">
                  <span className="status-process-label">{item.label}</span>
                  <span className="status-process-value" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
