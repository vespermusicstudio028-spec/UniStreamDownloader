# 🎬 UniStream Downloader Pro

Plataforma PWA premium para baixar vídeos e músicas de YouTube, Instagram, TikTok, Facebook, Twitter/X e mais.

## ✨ Funcionalidades

- ⬇️ Download de vídeos MP4 (360p / 480p / 720p / 1080p)
- 🎵 Download e conversão para MP3 (128 / 192 / 256 / 320 kbps)
- 🤖 Transcrição com IA (powered by Google Gemini)
- 📊 Progresso em tempo real via SSE
- ⭐ Favoritos e histórico de downloads
- 🔗 Compartilhamento e cópia de links
- 📱 PWA instalável no Android e Desktop
- 🎨 Design dark futurista com glassmorphism

## 🚀 Rodando Localmente

### Pré-requisitos
- Node.js 18+
- npm 9+

### Instalação

```bash
# 1. Clone ou baixe o projeto
cd "UniStream Downloader"

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY

# 4. Iniciar em modo desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
GEMINI_API_KEY=sua_chave_gemini_aqui
NODE_ENV=development
PORT=3000
```

## 🏗️ Build para Produção

```bash
npm run build
npm start
```

## 🌐 Deploy

### Render / Railway (recomendado — backend + frontend)
1. Conecte o repositório GitHub
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Adicione `GEMINI_API_KEY` nas variáveis de ambiente

### Vercel (apenas frontend)
1. Build Command: `npm run build`
2. Output Directory: `dist`
3. Framework: Vite

### VPS (Ubuntu/Debian)
```bash
npm install
npm run build
# Use PM2 para manter rodando:
pm2 start "npm start" --name unistream
```

## 🛠️ Tecnologias

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Backend | Node.js + Express |
| Downloads | Cobalt API + @distube/ytdl-core |
| Conversão | FFmpeg (via ffmpeg-static) |
| IA | Google Gemini |
| Progresso | Server-Sent Events (SSE) |
| PWA | manifest.json + Service Worker |

## 📁 Estrutura

```
├── server.ts          # Backend principal
├── server/
│   ├── routes/        # Rotas da API (/info, /download, /mp3)
│   ├── services/      # Cobalt, FFmpeg, yt-dlp, JobManager
│   └── utils/         # Logger, Retry, Cleanup
├── src/
│   ├── components/    # Componentes React premium
│   ├── hooks/         # useToast, useFavorites, useSSE
│   ├── services/      # Cliente API tipado
│   └── types.ts       # Tipos TypeScript
├── public/
│   ├── manifest.json  # PWA manifest
│   └── sw.js          # Service Worker
└── index.html         # Entry point com meta tags PWA
```

## 📄 API Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/info` | POST | Extrair metadados de um vídeo |
| `/api/download` | POST | Iniciar download de vídeo |
| `/api/download/progress/:id` | GET (SSE) | Progresso em tempo real |
| `/api/mp3` | POST | Iniciar download/conversão MP3 |
| `/api/mp3/progress/:id` | GET (SSE) | Progresso MP3 em tempo real |
| `/api/transcribe` | POST | Transcrever vídeo para texto |

---

Made with ❤️ by UniStream Pro Team
