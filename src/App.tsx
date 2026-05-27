import React, { useState, useEffect, useCallback } from 'react';
import { Download, Moon, Sun, Bell } from 'lucide-react';
import './index.css';

import { DownloadJob, DownloadFormat, MediaInfo } from './types';
import { useToast } from './hooks/useToast';
import { useFavorites } from './hooks/useFavorites';
import api from './services/api';

import HeroSection from './components/HeroSection';
import UrlInput from './components/UrlInput';
import MediaPreview from './components/MediaPreview';
import DownloadHistory from './components/DownloadHistory';
import ToastNotifications from './components/ToastNotifications';

// @ts-ignore
import unistreamLogo from './assets/images/unistream_logo_1779851975537.png';

const HISTORY_KEY = 'unistream_jobs_v2';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [jobs, setJobs] = useState<DownloadJob[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentInfo, setCurrentInfo] = useState<MediaInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { toasts, toast, removeToast } = useToast();
  const { favorites, toggleFavorite } = useFavorites();

  // Persist jobs
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(jobs.slice(0, 50)));
  }, [jobs]);

  // Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleInfoLoaded = useCallback((url: string, info: MediaInfo) => {
    setCurrentUrl(url);
    setCurrentInfo(info);
    toast.success(`✅ Detectado!`, info.title.substring(0, 60));
  }, [toast]);

  const handleError = useCallback((msg: string) => {
    toast.error('Erro', msg);
  }, [toast]);

  const handleStartDownload = useCallback(async (params: {
    format: DownloadFormat;
    quality: string;
    bitrate: number;
  }) => {
    if (!currentUrl || !currentInfo) return;
    setDownloading(true);

    const qualityNum = params.quality.split('p')[0] || '1080';
    const sanitizedTitle = currentInfo.title.replace(/[<>:"/\\|?*]/g, '').substring(0, 80);

    // Handle TXT (AI transcription)
    if (params.format === 'txt') {
      try {
        const result = await api.transcribe(currentUrl, sanitizedTitle);
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = `${sanitizedTitle}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('📝 Transcrição gerada!', 'Arquivo de texto baixado com sucesso.');
      } catch (err: any) {
        toast.error('Falha na transcrição', err.message);
      } finally {
        setDownloading(false);
      }
      return;
    }

    // Create job entry
    const jobId = crypto.randomUUID();
    const newJob: DownloadJob = {
      id: jobId,
      url: currentUrl,
      title: currentInfo.title,
      uploader: currentInfo.uploader,
      thumbnailUrl: currentInfo.thumbnailUrl,
      platform: currentInfo.platform.toLowerCase() as any,
      format: params.format,
      quality: params.quality,
      status: 'queued',
      progress: 0,
      speed: '',
      eta: '',
      message: '📋 Na fila...',
      fileSize: '',
      createdAt: Date.now(),
    };

    setJobs((prev) => [newJob, ...prev]);
    toast.info('⬇️ Download iniciado!', `${params.format.toUpperCase()} ${params.quality}`);

    try {
      let result: { jobId: string };

      if (params.format === 'mp3') {
        result = await api.startMp3({
          url: currentUrl,
          bitrate: params.bitrate,
          title: sanitizedTitle,
          artist: currentInfo.uploader,
        });
      } else {
        result = await api.startDownload({
          url: currentUrl,
          quality: qualityNum,
          format: params.format,
          title: sanitizedTitle,
        });
      }

      // Update job with server-assigned ID
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, id: result.jobId } : j))
      );
    } catch (err: any) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: 'error', error: err.message, message: '❌ ' + err.message }
            : j
        )
      );
      toast.error('Falha ao iniciar download', err.message);
    } finally {
      setDownloading(false);
    }
  }, [currentUrl, currentInfo, toast]);

  const handleUpdateJob = useCallback((id: string, updates: Partial<DownloadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));

    if (updates.status === 'done') {
      toast.success('✅ Download concluído!', 'Clique em Salvar para baixar o arquivo.');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('✅ UniStream — Download concluído!', {
          body: 'Seu arquivo está pronto para salvar.',
          icon: '/favicon.ico',
        });
      }
    }
  }, [toast]);

  const handleSaveJob = useCallback((job: DownloadJob) => {
    if (!job.filePath) {
      toast.error('Arquivo não disponível', 'O arquivo não está pronto ainda.');
      return;
    }

    const a = document.createElement('a');
    const url = job.filePath.startsWith('http') ? job.filePath : job.filePath;
    a.href = url;
    a.download = job.filename || `${job.title}.${job.format}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('💾 Salvando...', job.filename || `${job.title}.${job.format}`);
  }, [toast]);

  const handleDeleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    setJobs([]);
    toast.info('🗑️ Histórico limpo');
  }, [toast]);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
    toast.info(favorites.includes(id) ? 'Removido dos favoritos' : '⭐ Adicionado aos favoritos!');
  }, [toggleFavorite, favorites, toast]);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        toast.success('🔔 Notificações ativadas!', 'Você será avisado quando os downloads concluírem.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header
        className="header-blur"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '12px 20px',
        }}
      >
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={unistreamLogo} alt="UniStream" style={{ height: 32, width: 32, borderRadius: 8 }} />
            <div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem' }} className="gradient-text">
                UniStream
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>Pro</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={requestNotifications}
              className="btn btn-ghost btn-sm"
              title="Ativar notificações"
            >
              <Bell size={16} />
            </button>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="btn btn-ghost btn-sm"
              title="Alternar tema"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              🟢 Online
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ paddingBottom: 40 }}>
        {/* Hero */}
        <HeroSection />

        {/* URL Input */}
        <UrlInput
          onInfoLoaded={handleInfoLoaded}
          onError={handleError}
          loading={analyzing}
          setLoading={setAnalyzing}
        />

        {/* Media Preview card */}
        {currentInfo && currentUrl && (
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
            <MediaPreview
              url={currentUrl}
              info={currentInfo}
              onStartDownload={handleStartDownload}
              downloading={downloading}
            />
          </div>
        )}

        {/* Download History */}
        <DownloadHistory
          jobs={jobs}
          onUpdate={handleUpdateJob}
          onSave={handleSaveJob}
          onDelete={handleDeleteJob}
          onToggleFavorite={handleToggleFavorite}
          onClear={handleClearHistory}
          favorites={favorites}
        />
      </main>

      {/* Toast notifications */}
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
