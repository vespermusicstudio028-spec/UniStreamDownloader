import React, { useState } from 'react';
import { X, Copy, Share2, FileText, Download, Check, FileDown } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface TranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
}

export default function TranscriptionModal({ isOpen, onClose, title, text }: TranscriptionModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copiado!', 'Texto copiado para a área de transferência.');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro', 'Não foi possível copiar o texto.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `UniStream - Transcrição: ${title}`,
          text: text.substring(0, 300) + '...',
        });
        toast.success('Compartilhado!', 'Conteúdo enviado com sucesso.');
      } catch (err) {
        // user cancelled or failed
      }
    } else {
      handleCopy();
    }
  };

  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #111; line-height: 1.6; }
          h1 { color: #0891b2; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          pre { white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <pre>${text}</pre>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exportado!', 'Arquivo do Word (.doc) baixado.');
  };

  const handleExportPdf = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const htmlContent = `
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; font-size: 14px; padding: 20px; }
          h1 { color: #0891b2; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 20px; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="content">${text}</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.frameElement.remove();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `;
    doc.write(htmlContent);
    doc.close();
    toast.success('Visualização do PDF', 'A tela de impressão/PDF do navegador foi aberta.');
  };

  const handleExportTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Baixado!', 'Arquivo TXT salvo.');
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
        className="glass" 
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
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
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
              Transcrição & Letra por IA
            </span>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 2
            }}>
              {title}
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

        {/* Scrollable Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: 'rgba(0,0,0,0.2)',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {text}
        </div>

        {/* Action Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8
          }}>
            <button onClick={handleCopy} className="btn btn-secondary btn-sm" style={{ gap: 6, fontSize: '0.8rem' }}>
              {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <button onClick={handleShare} className="btn btn-secondary btn-sm" style={{ gap: 6, fontSize: '0.8rem' }}>
              <Share2 size={14} />
              Compartilhar
            </button>
            <button onClick={handleExportWord} className="btn btn-secondary btn-sm" style={{ gap: 6, fontSize: '0.8rem' }}>
              <FileText size={14} />
              Exportar Word
            </button>
            <button onClick={handleExportPdf} className="btn btn-secondary btn-sm" style={{ gap: 6, fontSize: '0.8rem' }}>
              <FileDown size={14} />
              Salvar em PDF
            </button>
          </div>
          <button 
            onClick={handleExportTxt} 
            className="btn btn-primary" 
            style={{ gap: 8, justifyContent: 'center', width: '100%', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            Baixar Arquivo de Texto (TXT)
          </button>
        </div>
      </div>
    </div>
  );
}
