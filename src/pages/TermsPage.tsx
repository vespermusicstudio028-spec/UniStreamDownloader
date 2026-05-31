import React from 'react';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: 'Ao acessar e utilizar o UniStream Downloader Pro ("Serviço"), você concorda com estes Termos de Uso. Se não concordar com qualquer parte, não utilize o serviço.',
  },
  {
    title: '2. Uso Permitido',
    content: 'O Serviço destina-se exclusivamente ao download e conversão de conteúdo público para uso pessoal, educacional ou em situações em que o usuário possua os devidos direitos sobre o conteúdo. É proibido usar o serviço para fins comerciais sem autorização prévia.',
  },
  {
    title: '3. Responsabilidade do Usuário',
    content: 'O usuário é o único responsável pelo uso do conteúdo baixado. Ao utilizar o Serviço, o usuário declara que tem os direitos ou as permissões necessárias para acessar e baixar o conteúdo solicitado. O UniStream Pro não se responsabiliza por violações de direitos autorais cometidas pelos usuários.',
  },
  {
    title: '4. Limitações do Serviço',
    content: 'O Serviço é fornecido "como está". Não garantimos disponibilidade 100% ou compatibilidade com todas as plataformas de mídia. Links de download expiram após 2 horas. O desempenho pode variar conforme a carga do servidor.',
  },
  {
    title: '5. Proibições',
    content: 'É proibido: (a) usar o serviço para fins ilegais; (b) tentar burlar limitações de requisições (rate limiting); (c) fazer engenharia reversa ou copiar o código-fonte sem autorização; (d) usar bots ou scripts automatizados em volume abusivo.',
  },
  {
    title: '6. Propriedade Intelectual',
    content: 'A plataforma UniStream Pro, seu design, código-fonte e marca são propriedade intelectual de seus criadores. O conteúdo baixado pelo usuário pertence aos seus respectivos detentores de direitos.',
  },
  {
    title: '7. Modificações do Serviço',
    content: 'Reservamo-nos o direito de modificar, suspender ou encerrar qualquer funcionalidade do Serviço a qualquer momento, sem aviso prévio, por razões técnicas, legais ou comerciais.',
  },
  {
    title: '8. Lei Aplicável',
    content: 'Estes Termos são regidos pelas leis brasileiras, em especial o Marco Civil da Internet (Lei 12.965/2014) e a LGPD (Lei 13.709/2018). Qualquer disputa será resolvida no foro da comarca do provedor.',
  },
];

export default function TermsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <FileText size={28} color="var(--indigo-light)" />
          <h1 className="page-title gradient-text" style={{ margin: 0 }}>Termos de Uso</h1>
        </div>
        <p className="page-subtitle">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="page-section glass" style={{ marginBottom: 16 }}>
        <p className="page-text">
          Leia atentamente estes termos antes de utilizar o UniStream Downloader Pro. O uso da plataforma implica na aceitação integral destas condições.
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
