import React from 'react';
import { Lock } from 'lucide-react';

const sections = [
  {
    title: '1. Informações Coletadas',
    content: 'O UniStream Pro não exige cadastro ou login. Não coletamos dados pessoais identificáveis. As URLs inseridas são processadas temporariamente para extração de mídia e não são armazenadas em banco de dados permanente.',
  },
  {
    title: '2. Uso das Informações',
    content: 'As URLs processadas são usadas exclusivamente para executar o download/conversão solicitado. Nenhuma informação é compartilhada com terceiros para fins comerciais.',
  },
  {
    title: '3. Cookies e Armazenamento Local',
    content: 'Utilizamos localStorage do navegador para salvar seu histórico de downloads localmente, em seu próprio dispositivo. Esse dado nunca é enviado a nossos servidores. Você pode limpar o histórico a qualquer momento.',
  },
  {
    title: '4. Arquivos Temporários',
    content: 'Arquivos convertidos são armazenados temporariamente em nossos servidores por no máximo 2 horas para permitir o download. Após esse período, são automaticamente removidos.',
  },
  {
    title: '5. Serviços de Terceiros',
    content: 'Utilizamos Cobalt API, Google Gemini AI e yt-dlp para processar mídia. Ao usar o UniStream, você concorda que o conteúdo solicitado seja processado por esses serviços externos conforme suas próprias políticas.',
  },
  {
    title: '6. Segurança',
    content: 'Implementamos validação de URLs, rate limiting e headers de segurança para proteger nossa infraestrutura e nossos usuários. Bloqueamos requisições para endereços internos (proteção SSRF).',
  },
  {
    title: '7. Direitos Autorais',
    content: 'O UniStream Pro é uma ferramenta técnica de conversão. É responsabilidade do usuário garantir que possui os direitos ou permissões necessários para baixar e usar o conteúdo acessado.',
  },
  {
    title: '8. Alterações nesta Política',
    content: 'Esta política pode ser atualizada periodicamente. O uso continuado da plataforma após mudanças constitui aceitação da nova versão.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Lock size={28} color="var(--cyan)" />
          <h1 className="page-title gradient-text" style={{ margin: 0 }}>Política de Privacidade</h1>
        </div>
        <p className="page-subtitle">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="page-section glass" style={{ marginBottom: 16 }}>
        <p className="page-text">
          Sua privacidade é fundamental para nós. Esta política descreve como o UniStream Pro coleta, usa e protege suas informações ao utilizar nossa plataforma.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sections.map((section) => (
          <div key={section.title} className="page-section glass">
            <h2 className="page-section-title" style={{ fontSize: '1rem' }}>{section.title}</h2>
            <p className="page-text">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
