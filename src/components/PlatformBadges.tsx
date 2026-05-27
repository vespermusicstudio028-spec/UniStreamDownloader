import React from 'react';

const PLATFORMS = [
  { name: 'YouTube', color: '#ff4444', icon: '▶' },
  { name: 'Instagram', color: '#e1306c', icon: '📷' },
  { name: 'TikTok', color: '#69c9d0', icon: '♪' },
  { name: 'Facebook', color: '#4080ff', icon: 'f' },
  { name: 'Twitter/X', color: '#1da1f2', icon: '𝕏' },
  { name: 'Kwai', color: '#ff6800', icon: '◉' },
  { name: 'Vimeo', color: '#1ab7ea', icon: '▲' },
  { name: 'Reddit', color: '#ff4500', icon: '◈' },
];

export default function PlatformBadges() {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
        marginBottom: '14px'
      }}>
        Plataformas suportadas
      </p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
      }}>
        {PLATFORMS.map((p, i) => (
          <div
            key={p.name}
            className="animate-fade-in"
            style={{
              animationDelay: `${i * 0.05}s`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: `rgba(${hexToRgb(p.color)}, 0.08)`,
              border: `1px solid rgba(${hexToRgb(p.color)}, 0.2)`,
              fontSize: '0.78rem',
              fontWeight: 600,
              color: p.color,
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
          >
            <span style={{ fontSize: '0.7rem' }}>{p.icon}</span>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
