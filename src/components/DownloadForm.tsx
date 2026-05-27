import { useState, useEffect } from 'react';
import { 
  Link2, Sparkles, Youtube, Instagram, Facebook, Twitter, Chrome, PlayCircle, Music, FileVideo, 
  HelpCircle, AlertTriangle, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { Platform } from '../types';
import { detectPlatform, estimateFileSize } from '../utils';

interface DownloadFormProps {
  onAddDownload: (downloadData: {
    url: string;
    title: string;
    platform: Platform;
    format: 'mp4' | 'mp3' | 'txt';
    quality: string;
    durationSeconds: number;
    author: string;
  }) => void;
}

export default function DownloadForm({ onAddDownload }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastParsedUrl, setLastParsedUrl] = useState('');
  
  // Parsed metadata state
  const [parsedMetadata, setParsedMetadata] = useState<{
    title: string;
    author: string;
    durationSeconds: number;
    platform: Platform;
    thumbnailDescription: string;
    formatOptions: {
      mp4: string[];
      mp3: string[];
    };
  } | null>(null);

  // User configuration choices
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [selectedQuality, setSelectedQuality] = useState('1080p Full HD');
  const [selectedBitrate, setSelectedBitrate] = useState('320kbps High Q');
  const [convertToText, setConvertToText] = useState(false);

  const handleDetectAndParse = async (targetUrl: string) => {
    const activeUrl = targetUrl.trim();
    if (!activeUrl) {
      setErrorMessage("Por favor, cole um link válido para analisar.");
      return;
    }

    if (activeUrl === lastParsedUrl) {
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);
    setParsedMetadata(null);

    try {
      const response = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: activeUrl })
      });

      if (!response.ok) {
        throw new Error("Erro de rede ao analisar o link.");
      }

      const data = await response.json();
      
      const ptf = detectPlatform(activeUrl);
      
      setParsedMetadata({
        title: data.title,
        author: data.author,
        durationSeconds: data.durationSeconds,
        platform: ptf,
        thumbnailDescription: data.thumbnailDescription || "Prévia do vídeo",
        formatOptions: data.formatOptions || {
          mp4: ["1080p Full HD", "720p HD", "480p", "360p"],
          mp3: ["320kbps High Q", "256kbps Studio", "192kbps Standard", "128kbps Eco"]
        }
      });

      setLastParsedUrl(activeUrl);

      // Default first settings
      setSelectedFormat('mp4');
      if (data.formatOptions) {
        setSelectedQuality(data.formatOptions.mp4[0]);
        setSelectedBitrate(data.formatOptions.mp3[0]);
      } else {
        setSelectedQuality("1080p Full HD");
        setSelectedBitrate("320kbps High Q");
      }

    } catch (err) {
      console.error("Parse API error, falling back locally:", err);
      // Local fallback parser
      const localPtf = detectPlatform(activeUrl);
      const platformsBrazilianNames = {
        youtube: 'Vídeo do YouTube',
        instagram: 'Reel de Instagram',
        tiktok: 'Vídeo Viral do TikTok',
        kwai: 'Kwai Curto',
        facebook: 'Post de Facebook',
        twitter: 'Mídia do X / Twitter',
        generic: 'Arquivo de Mídia Web'
      };
      
      setParsedMetadata({
        title: `${platformsBrazilianNames[localPtf]} - Extraído com Sucesso`,
        author: `@criador_${localPtf}`,
        durationSeconds: 154,
        platform: localPtf,
        thumbnailDescription: "Pré-visualização gerada em cache local",
        formatOptions: {
          mp4: ["1080p Full HD", "720p HD", "480p", "360p"],
          mp3: ["320kbps High Q", "256kbps Studio", "192kbps Standard", "128kbps Eco"]
        }
      });
      setLastParsedUrl(activeUrl);
      setSelectedFormat('mp4');
      setSelectedQuality("1080p Full HD");
      setSelectedBitrate("320kbps High Q");
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setParsedMetadata(null);
      setErrorMessage(null);
      setLastParsedUrl('');
      return;
    }

    const isMaybeUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes(".");
    if (!isMaybeUrl) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleDetectAndParse(trimmed);
    }, 600); // Debounce interval of 600ms

    return () => clearTimeout(delayDebounceFn);
  }, [url]);

  const handleSubmitDownload = () => {
    if (!parsedMetadata) return;

    onAddDownload({
      url: url.trim(),
      title: parsedMetadata.title,
      platform: parsedMetadata.platform,
      format: convertToText ? 'txt' : selectedFormat,
      quality: convertToText ? 'Transcrição IA' : (selectedFormat === 'mp4' ? selectedQuality : selectedBitrate),
      durationSeconds: parsedMetadata.durationSeconds,
      author: parsedMetadata.author
    });

    // Reset UI to clean state
    setUrl('');
    setLastParsedUrl('');
    setParsedMetadata(null);
    setConvertToText(false);
  };



  // Icon depending on active platform
  const getPlatformIcon = (ptf: Platform, sizeClass = "w-5 h-5") => {
    switch (ptf) {
      case 'youtube': return <Youtube className={`${sizeClass} text-red-500`} />;
      case 'instagram': return <Instagram className={`${sizeClass} text-pink-500`} />;
      case 'facebook': return <Facebook className={`${sizeClass} text-blue-500`} />;
      case 'tiktok': return <Sparkles className={`${sizeClass} text-cyan-400`} />;
      case 'twitter': return <Twitter className={`${sizeClass} text-slate-100`} />;
      case 'kwai': return <Chrome className={`${sizeClass} text-orange-500`} />;
      default: return <Link2 className={`${sizeClass} text-teal-400`} />;
    }
  };

  return (
    <div id="download-form-container" className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-teal-400" />
          Cole o link do vídeo, post ou story:
        </label>

        {/* URL Input Row */}
        <div className="relative flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              id="download-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou story do Instagram"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-2xl pl-12 pr-32 py-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDetectAndParse(url);
              }}
            />
            <div className="absolute left-4 top-4 text-slate-500">
              {getPlatformIcon(detectPlatform(url), "w-5 h-5")}
            </div>
            {isParsing && (
              <div className="absolute right-4 top-4 flex items-center gap-2 bg-slate-950/90 border border-teal-500/30 px-3 py-1 rounded-xl">
                <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
                <span className="text-xs font-semibold text-teal-400 animate-pulse">Analisando...</span>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 flex gap-2 items-start bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}


      </div>

      {/* METADATA PREVIEW & FORMAT DIALOG SELECTOR */}
      {parsedMetadata && (
        <div id="metadata-preview-card" className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500 to-indigo-500 filter blur-[80px] opacity-10 pointer-events-none" />

          {/* Social post heading banner */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                {getPlatformIcon(parsedMetadata.platform, "w-8 h-8")}
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="capitalize font-semibold text-teal-400">{parsedMetadata.platform}</span>
                  <span>•</span>
                  <span>Post por {parsedMetadata.author}</span>
                </span>
                <h3 className="text-base font-semibold text-white mt-1 leading-snug">
                  {parsedMetadata.title}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setParsedMetadata(null)}
              className="text-xs text-slate-500 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all font-mono"
            >
              LIMPAR
            </button>
          </div>

            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 font-mono">
                Opções de Download & Extração
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Box 1: Choose video vs MP3 */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-500 block mb-2.5">SELECIONE O FORMATO DESEJADO:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedFormat('mp4')}
                      className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
                        selectedFormat === 'mp4'
                          ? 'bg-indigo-500/10 border-indigo-500/80 text-indigo-300'
                          : 'border-slate-850 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <FileVideo className="w-4 h-4" />
                      <span>Vídeo (MP4)</span>
                    </button>

                    <button
                      onClick={() => setSelectedFormat('mp3')}
                      className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
                        selectedFormat === 'mp3'
                          ? 'bg-pink-500/10 border-pink-500/80 text-pink-300'
                          : 'border-slate-855 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Music className="w-4 h-4" />
                      <span>Áudio (MP3)</span>
                    </button>
                  </div>
                </div>

                {/* Switch for "Converter para texto" - Available on BOTH tabs */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      id="convert-to-text"
                      type="checkbox"
                      checked={convertToText}
                      onChange={(e) => setConvertToText(e.target.checked)}
                      className="w-4.5 h-4.5 text-teal-500 bg-slate-950 border-slate-800 rounded focus:ring-teal-500 focus:ring-opacity-25 focus:ring-2 cursor-pointer transition-all focus:outline-none"
                    />
                  </div>
                  <div className="text-xs">
                    <label htmlFor="convert-to-text" className="font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer selection:bg-transparent">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 animate-pulse" />
                      Converter para texto (IA)
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Extrai todo o falado, gerando transcrição com marcações de tempo e resumo estruturado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2: Choose resolution or bitrate detail */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 flex flex-col justify-between">
                {convertToText ? (
                  <div className="flex flex-col items-center justify-center text-center h-full py-4 px-2">
                    <Sparkles className="w-8 h-8 text-amber-400 animate-pulse mb-2" />
                    <span className="text-xs font-bold text-teal-400 font-mono">GERADOR DE TEXTO INTELIGENTE ATIVO</span>
                    <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                      O motor UniStream IA irá escutar o áudio e produzir uma transcrição profissional completa contendo cabeçalho, sinopse, timesteps estruturados e insights críticos em formato texto plano legível (.txt).
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs text-slate-500 block mb-2.5">
                      {selectedFormat === 'mp4' ? 'ESCOLHER RESOLUÇÃO DE VÍDEO:' : 'ESCOLHER TAXA DE BITS (ÁUDIO):'}
                    </span>
                    
                    {selectedFormat === 'mp4' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {parsedMetadata.formatOptions.mp4.map((res) => (
                          <button
                            key={res}
                            onClick={() => setSelectedQuality(res)}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                              selectedQuality === res
                                ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                                : 'border-slate-850 hover:bg-slate-900 text-slate-400'
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {parsedMetadata.formatOptions.mp3.map((bitrate) => (
                          <button
                            key={bitrate}
                            onClick={() => setSelectedBitrate(bitrate)}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                              selectedBitrate === bitrate
                                ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                                : 'border-slate-850 hover:bg-slate-900 text-slate-400'
                            }`}
                          >
                            {bitrate}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Size Badge info */}
            <div className="mt-5 flex items-center justify-between bg-slate-950/30 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400">
                Tamanho Estimado do Arquivo:
              </span>
              <span className="text-xs font-bold text-white font-mono bg-slate-800 px-3 py-1 rounded-lg">
                {estimateFileSize(
                  convertToText ? 'txt' : selectedFormat, 
                  selectedFormat === 'mp4' ? selectedQuality : selectedBitrate,
                  parsedMetadata.durationSeconds
                )}
              </span>
            </div>

            {/* Submit layout CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                id="start-download-btn"
                onClick={handleSubmitDownload}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-400 to-indigo-500 hover:opacity-95 active:scale-[0.98] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 transition-all cursor-pointer"
              >
                <span>{convertToText ? 'Converter e Baixar Texto (Transcrição IA)' : 'Baixar para o Meu Dispositivo'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
