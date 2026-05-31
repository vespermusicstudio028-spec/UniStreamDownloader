import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Github, Twitter, Instagram, Heart, Activity } from 'lucide-react';

const footerLinks = [
  { to: '/sobre', label: 'Sobre' },
  { to: '/status', label: 'Status' },
  { to: '/termos', label: 'Termos de Uso' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/contato', label: 'Contato' },
];

export default function FooterNav() {
  const location = useLocation();

  return (
    <footer className="footer-nav">
      <div className="footer-nav-inner">
        {/* Brand */}
        <div className="footer-brand">
          <span className="gradient-text" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
            UniStream Pro
          </span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
            Plataforma profissional de download e conversão de mídia.
          </p>
          <div className="footer-status-badge">
            <Activity size={10} color="var(--emerald)" />
            <Link to="/status" style={{ color: 'var(--emerald)', fontSize: '0.7rem', textDecoration: 'none' }}>
              Verificar status
            </Link>
          </div>
        </div>

        {/* Links */}
        <nav className="footer-links">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`footer-link ${location.pathname === link.to ? 'footer-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Social */}
        <div className="footer-social">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="GitHub">
            <Github size={16} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Twitter/X">
            <Twitter size={16} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Instagram">
            <Instagram size={16} />
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} UniStream Pro. Todos os direitos reservados.</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Feito com <Heart size={12} color="var(--rose)" fill="var(--rose)" /> para criadores de conteúdo
        </span>
      </div>
    </footer>
  );
}
