import React, { useState, useEffect } from 'react';
import { Download, Zap } from 'lucide-react';
import PlatformBadges from './PlatformBadges';

const ROTATING_WORDS = ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Twitter/X', 'Kwai', 'Vimeo'];

export default function HeroSection() {
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
        setFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px 40px', maxWidth: 800, margin: '0 auto' }}>
      {/* Badge */}
      <div className="badge badge-cyan animate-fade-in" style={{ marginBottom: '24px', display: 'inline-flex' }}>
        <Zap size={12} />
        Plataforma Premium de Downloads
      </div>

      {/* Main title */}
      <h1 className="animate-slide-up" style={{
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: 900,
        lineHeight: 1.1,
        marginBottom: '16px',
      }}>
        Baixe de{' '}
        <span
          style={{
            display: 'inline-block',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: fade ? 1 : 0,
            transform: fade ? 'translateY(0)' : 'translateY(-8px)',
          }}
          className="gradient-text"
        >
          {ROTATING_WORDS[wordIdx]}
        </span>
        <br />
        com qualidade máxima
      </h1>

      {/* Subtitle */}
      <p className="animate-slide-up stagger-2" style={{
        fontSize: '1.05rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: '40px',
        maxWidth: 520,
        margin: '0 auto 40px',
      }}>
        Cole o link abaixo. Detectamos o vídeo automaticamente e você baixa em MP4, MP3 ou converte para texto com IA.
      </p>

      {/* Platform badges */}
      <div className="animate-slide-up stagger-4">
        <PlatformBadges />
      </div>
    </div>
  );
}
