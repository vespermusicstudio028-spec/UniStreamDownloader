import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Download, Moon, Sun, Bell, Activity } from 'lucide-react';
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
import FooterNav from './components/FooterNav';
import StatusPage from './components/StatusPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';

// @ts-ignore
import unistreamLogo from './assets/images/unistream_logo_1779851975537.png';

const HISTORY_KEY = 'unistream_jobs_v2';

// ── Shared Header ───────────────────────────────────────────────────────────
function Header({ darkMode, onToggleDark, onRequestNotifications }: {
  darkMode: boolean;
  onToggleDark: () => void;
  onRequestNotifications: () => void;
}) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const navLinks = [
    { to: '/status', label: 'Status' },
    { to: '/sobre', label: 'Sobre' },
  ];

  return (
    <header className="header-blur" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={unistreamLogo} alt="UniStream" style={{ height: 32, width: 32, borderRadius: 8 }} />
          <div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem' }} className="gradient-text">
              UniStream
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>Pro</span>
          </div>
        </Link>

        {/* Nav links (hidden on mobile, visible on md+) */}
        <nav className="header-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`header-nav-link ${location.pathname === link.to ? 'header-nav-link-active' : ''}`}
            >
              {link.to === '/status' && <Activity size={13} />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={onRequestNotifications} className="btn btn-ghost btn-sm" title="Ativar notificações">
            <Bell size={16} />
          </button>
          <button onClick={onToggleDark} className="btn btn-ghost btn-sm" title="Alternar tema">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/status" className="badge badge-emerald" style={{ fontSize: '0.7rem', textDecoration: 'none' }}>
            🟢 Online
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Home Page ────────────────────────────────────────────────────────────────
function HomePage({
  jobs, analyzing, downloading, currentUrl, currentInfo,
  onInfoLoaded, onError, setAnalyzing, onStartDownload,
  onUpdateJob, onSaveJob, onDeleteJob, onToggleFavorite, onClearHistory, favorites,
}: any) {
  return (
    <main style={{ paddingBottom: 40 }}>
      <HeroSection />
      <UrlInput
        onInfoLoaded={onInfoLoaded}
        onError={onError}
        loading={analyzing}
        setLoading={setAnalyzing}
      />
      {currentInfo && currentUrl && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
          <MediaPreview
            url={currentUrl}
            info={currentInfo}
            onStartDownload={onStartDownload}
            downloading={downloading}
          />
        </div>
      )}
      <DownloadHistory
        jobs={jobs}
        onUpdate={onUpdateJob}
        onSave={onSaveJob}
        onDelete={onDeleteJob}
        onToggleFavorite={onToggleFavorite}
        onClear={onClearHistory}
        favorites={favorites}
      />
    </main>
  );
}

// ── Page Wrapper ─────────────────────────────────────────────────────────────
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ paddingBottom: 40, minHeight: 'calc(100vh - 200px)' }}>
      {children}
    </main>
  );
}

// ── App Root ─────────────────────────────────────────────────────────────────
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
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
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
      toast.success('✅ Download concluído!', 'Arquivo validado e pronto para baixar.');
      if (updates.filePath) {
        const a = document.createElement('a');
        a.href = updates.filePath;
        a.download = updates.filename || `unistream`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('✅ UniStream — Download concluído!', {
          body: 'Arquivo validado e sendo baixado.',
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
    a.href = job.filePath;
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

  const homeProps = {
    jobs, analyzing, downloading, currentUrl, currentInfo,
    onInfoLoaded: handleInfoLoaded,
    onError: handleError,
    setAnalyzing,
    onStartDownload: handleStartDownload,
    onUpdateJob: handleUpdateJob,
    onSaveJob: handleSaveJob,
    onDeleteJob: handleDeleteJob,
    onToggleFavorite: handleToggleFavorite,
    onClearHistory: handleClearHistory,
    favorites,
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Header
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((p) => !p)}
        onRequestNotifications={requestNotifications}
      />

      <Routes>
        <Route path="/" element={<HomePage {...homeProps} />} />
        <Route path="/status" element={<PageWrapper><StatusPage /></PageWrapper>} />
        <Route path="/sobre" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="/privacidade" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
        <Route path="/termos" element={<PageWrapper><TermsPage /></PageWrapper>} />
        <Route path="/contato" element={<PageWrapper><ContactPage /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <FooterNav />
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
