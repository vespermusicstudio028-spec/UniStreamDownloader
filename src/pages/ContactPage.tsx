import React, { useState } from 'react';
import { Mail, MessageSquare, Github, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would POST to a contact API
    // For now, simulate success
    setSent(true);
  };

  const subjects = [
    'Problema técnico',
    'Sugestão de melhoria',
    'Direitos autorais',
    'Parceria comercial',
    'Outro',
  ];

  if (sent) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, textAlign: 'center' }}>
          <CheckCircle size={64} color="var(--emerald)" />
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem' }}>Mensagem enviada!</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Obrigado pelo contato. Responderemos em até 48 horas.
          </p>
          <button className="btn btn-secondary" onClick={() => setSent(false)}>
            Enviar outra mensagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <MessageSquare size={28} color="var(--emerald)" />
          <h1 className="page-title gradient-text" style={{ margin: 0 }}>Contato</h1>
        </div>
        <p className="page-subtitle">
          Ficou com dúvidas, encontrou um problema ou tem uma sugestão? Fale conosco.
        </p>
      </div>

      <div className="contact-layout">
        {/* Contact form */}
        <div className="page-section glass contact-form-card">
          <h2 className="page-section-title">Enviar Mensagem</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input
                className="input-field"
                type="text"
                placeholder="Seu nome"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input
                className="input-field"
                type="email"
                placeholder="seu@email.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assunto *</label>
              <select
                className="input-field"
                required
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Selecione um assunto</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mensagem *</label>
              <textarea
                className="input-field"
                rows={5}
                placeholder="Descreva detalhadamente sua dúvida ou sugestão..."
                required
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Send size={14} />
              Enviar Mensagem
            </button>
          </form>
        </div>

        {/* Contact info sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="page-section glass">
            <h3 className="page-section-title">Outros Canais</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="mailto:suporte@unistream.pro" className="contact-link">
                <Mail size={16} color="var(--cyan)" />
                <span>suporte@unistream.pro</span>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="contact-link">
                <Github size={16} color="var(--text-secondary)" />
                <span>GitHub — Reportar bug</span>
              </a>
            </div>
          </div>

          <div className="page-section glass">
            <h3 className="page-section-title">Tempo de Resposta</h3>
            <p className="page-text">
              Respondemos em até <strong style={{ color: 'var(--cyan)' }}>48 horas úteis</strong> para assuntos gerais. Problemas técnicos urgentes têm prioridade.
            </p>
          </div>

          <div className="page-section glass">
            <h3 className="page-section-title">Antes de Entrar em Contato</h3>
            <ul className="page-list">
              <li>Verifique a página de <a href="/status" style={{ color: 'var(--cyan)' }}>Status</a> para saber se há alguma interrupção.</li>
              <li>Tente novamente com outra URL ou plataforma.</li>
              <li>Limpe o cache do navegador.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
