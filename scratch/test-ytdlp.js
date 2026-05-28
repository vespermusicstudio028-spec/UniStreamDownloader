import { downloadWithYtdlp } from '../server/services/ytdlp.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    console.log('Iniciando teste de download de áudio...');
    const result = await downloadWithYtdlp({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      audioOnly: true
    });
    console.log('Download concluído com sucesso:', result);
  } catch (err) {
    console.error('Falha no teste:', err);
  }
}
run();
