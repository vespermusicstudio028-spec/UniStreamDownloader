import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Music } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  filename?: string;
  title?: string;
  duration?: number;    // seconds (from server validation)
  bitrate?: number;     // kbps
  sampleRate?: number;  // Hz
  channels?: number;
  fileSize?: number;    // bytes
  format?: string;
  onDownload?: () => void;
}

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

export default function AudioPlayer({
  src, filename, title, duration: serverDuration,
  bitrate, sampleRate, channels, fileSize, format = 'MP3',
  onDownload
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(serverDuration || 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serverDuration) setDuration(serverDuration);
  }, [serverDuration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = (e.target as HTMLAudioElement).duration;
          if (d && isFinite(d)) setDuration(d);
          setLoading(false);
        }}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Title row */}
      <div className="audio-player-header">
        <div className="audio-player-icon">
          <Music size={18} color="var(--cyan)" />
        </div>
        <div className="audio-player-title">
          <span className="audio-player-name">{title || filename || 'Áudio'}</span>
          <span className="audio-player-meta">
            {format.toUpperCase()} · {bitrate ? `${bitrate}kbps` : '128kbps'} CBR
            {sampleRate ? ` · ${(sampleRate / 1000).toFixed(1)}kHz` : ''}
            {channels ? ` · ${channels === 2 ? 'Stereo' : 'Mono'}` : ''}
            {fileSize ? ` · ${formatBytes(fileSize)}` : ''}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="audio-player-progress-wrap" onClick={seek} title="Clique para navegar">
        <div className="audio-player-progress-track">
          <div
            className="audio-player-progress-bar"
            style={{ width: `${progress}%` }}
          />
          <div
            className="audio-player-thumb"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      {/* Time labels */}
      <div className="audio-player-times">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="audio-player-controls">
        {/* Volume */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setMuted(!muted);
            if (audioRef.current) audioRef.current.muted = !muted;
          }}
          title={muted ? 'Ativar som' : 'Silenciar'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Play / Pause */}
        <button
          className="btn btn-primary audio-player-play-btn"
          onClick={togglePlay}
          disabled={loading}
          title={playing ? 'Pausar' : 'Reproduzir preview'}
        >
          {loading ? (
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          ) : playing ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
          {playing ? 'Pausar' : 'Ouvir Preview'}
        </button>

        {/* Download */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onDownload}
          title="Baixar arquivo"
        >
          <Download size={14} />
          Baixar
        </button>
      </div>
    </div>
  );
}
