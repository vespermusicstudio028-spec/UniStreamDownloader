import React, { useState } from 'react';
import { X, Save, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey: string;
}

export default function SettingsModal({ isOpen, onClose, onSave, initialKey }: SettingsModalProps) {
  const [key, setKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(key.trim());
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3,7,18,0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }} onClick={onClose}>
      <div 
        className="glass animate-scale-up" 
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          animation: 'scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="var(--cyan)" />
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              Configurações de IA
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-sm"
            style={{ padding: 4, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Chave API do Google Gemini
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Insira sua chave (AIzaSy...)"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
              Esta chave é salva localmente apenas no seu navegador. Ela é usada diretamente pelo servidor para as requisições de transcrição e análise de IA.
            </p>
          </div>

          <div style={{
            background: 'rgba(8,145,178,0.05)',
            border: '1px solid rgba(8,145,178,0.15)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start'
          }}>
            <ShieldCheck size={18} color="var(--cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
              <strong>Como conseguir uma chave gratuita?</strong>
              <br />
              Você pode gerar uma chave Gemini API gratuita em poucos segundos acessando o <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--cyan)', textDecoration: 'underline', fontWeight: 600 }}
              >
                Google AI Studio
              </a>.
            </div>
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 10,
            borderTop: '1px solid var(--border)',
            paddingTop: 16
          }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary btn-sm" 
              style={{ gap: 6, fontSize: '0.8rem' }}
            >
              <Save size={14} />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
