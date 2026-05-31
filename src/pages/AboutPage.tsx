import React from 'react';
import { Download, Zap, Shield, Globe, Star, Users } from 'lucide-react';

const features = [
  { icon: Download, title: 'Download Universal', desc: 'Suporte a YouTube, Instagram, TikTok, Facebook, Twitter/X, Kwai, Vimeo e dezenas de outras plataformas.' },
  { icon: Zap, title: 'Conversão Profissional', desc: 'MP3 CBR 128kbps, 44.1kHz, Stereo com tags ID3v2.3 — compatível com todos os dispositivos e players.' },
  { icon: Shield, title: 'Validação Automática', desc: 'Cada arquivo passa por testes automáticos de duração, bitrate e integridade antes de ser liberado.' },
  { icon: Globe, title: 'PWA — Instale no Celular', desc: 'Funciona como aplicativo nativo no Android e iPhone, com uso offline e atualizações automáticas.' },
  { icon: Star, title: 'IA Integrada', desc: 'Transcrição automática de vídeos para texto com timestamps, powered by Google Gemini.' },
  { icon: Users, title: 'Escalável', desc: 'Arquitetura preparada para milhares de usuários simultâneos com rate limiting e cache inteligente.' },
];

export default function AboutPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title gradient-text">Sobre o UniStream Pro</h1>
        <p className="page-subtitle">
          Uma plataforma profissional de download e conversão de mídia, construída para criadores de conteúdo, estudantes e profissionais.
        </p>
      </div>

      <div className="page-section glass">
        <h2 className="page-section-title">Nossa Missão</h2>
        <p className="page-text">
          O UniStream Downloader Pro nasceu da necessidade de ter uma ferramenta confiável, rápida e com alta qualidade de áudio para quem precisa trabalhar com mídia digital. Diferente de outras ferramentas, priorizamos a qualidade do arquivo gerado — todo MP3 passa por validação automática antes de ser entregue.
        </p>
        <p className="page-text" style={{ marginTop: 12 }}>
          Nossa stack é 100% moderna: Node.js + Express no backend, React + Vite no frontend, FFmpeg para conversão profissional e yt-dlp para extração de mídia com máxima compatibilidade.
        </p>
      </div>

      <div className="page-section">
        <h2 className="page-section-title">Funcionalidades</h2>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card glass glass-hover">
              <div className="feature-icon">
                <Icon size={22} color="var(--cyan)" />
              </div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section glass">
        <h2 className="page-section-title">Tecnologias</h2>
        <div className="tech-tags">
          {['React 19', 'TypeScript', 'Node.js', 'Express', 'FFmpeg', 'yt-dlp', 'Vite', 'PWA', 'Google Gemini AI', 'Cobalt API'].map((tech) => (
            <span key={tech} className="badge badge-cyan">{tech}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
