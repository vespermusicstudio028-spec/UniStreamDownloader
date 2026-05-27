import { useState, useEffect, ChangeEvent } from 'react';
import { Folder, Check, AlertCircle, Info, Settings } from 'lucide-react';

interface FolderSelectorProps {
  customFolder: string;
  setCustomFolder: (folderName: string) => void;
  dirHandle: any | null;
  setDirHandle: (handle: any | null) => void;
}

export default function FolderSelector({
  customFolder,
  setCustomFolder,
  dirHandle,
  setDirHandle
}: FolderSelectorProps) {
  const [isApiSupported, setIsApiSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    // Check if File System Access API is supported
    if ('showDirectoryPicker' in window) {
      setIsApiSupported(true);
    }
    
    // Retrieve initial custom folder name if persisted
    const savedFolder = localStorage.getItem('unistream_custom_folder');
    if (savedFolder && !customFolder) {
      setCustomFolder(savedFolder);
    }
  }, [customFolder, setCustomFolder]);

  const handleSelectFolder = async () => {
    setErrorText(null);
    if (!isApiSupported) {
      // Manual/Simulated folder configuration
      return;
    }

    try {
      // Prompt user to select directory
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      setDirHandle(handle);
      setCustomFolder(handle.name);
      localStorage.setItem('unistream_custom_folder', handle.name);
      setPermissionState('granted');
    } catch (err: any) {
      console.warn("FSA Picker error/blocked:", err);
      if (err.name === 'AbortError') {
        // User cancelled, do nothing
        return;
      }
      setErrorText(
        "O navegador bloqueou o seletor. Isso é comum quando rodando dentro de um iframe de teste ou em dispositivos móveis que não suportam a File System Access API de escrita direta."
      );
    }
  };

  const handleManualFolderNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomFolder(val);
    localStorage.setItem('unistream_custom_folder', val);
  };

  return (
    <div id="folder-selector" className="glass-panel p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-cyan-400" />
            Pasta de Destino Personalizada
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            Configure onde o PWA gravará os arquivos finais baixados. PWAs avançados usam acesso local direto para organizar mídias de forma inteligente.
          </p>
        </div>

        {/* Configuration CTA */}
        <div className="flex items-center gap-2">
          {isApiSupported ? (
            <button
              id="select-folder-btn"
              onClick={handleSelectFolder}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                dirHandle 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30' 
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold hover:opacity-90 shadow-lg shadow-cyan-500/20'
              }`}
            >
              <Folder className="w-4 h-4" />
              {dirHandle ? 'Alterar Pasta Local' : 'Vincular Pasta PWA'}
            </button>
          ) : (
            <span className="text-[10px] uppercase tracking-wider font-mono bg-white/5 text-white/60 px-2.5 py-1 rounded-md border border-white/10">
              Modo Organização Ativo
            </span>
          )}
        </div>
      </div>

      {/* Path Configuration details */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div>
          <label className="block text-xs font-semibold text-white/40 mb-1.5 font-mono uppercase tracking-wider">
            NOME DA PASTA DE SALVAMENTO
          </label>
          <div className="relative">
            <input
              id="custom-folder-input"
              type="text"
              value={customFolder}
              onChange={handleManualFolderNameChange}
              placeholder="Ex: Downloads/UniStream"
              className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
            {customFolder && (
              <div className="absolute right-3 top-3.5 text-cyan-400">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-white/60 font-sans leading-relaxed">
              {isApiSupported && dirHandle ? (
                <span className="text-cyan-300">
                  ✔ <strong>Pasta ativa: {dirHandle.name}</strong>. Vídeos e MP3s serão escritos diretamente no seu dispositivo mantendo a estrutura local de diretórios.
                </span>
              ) : isApiSupported ? (
                <span>
                  O navegador suporta gravação direta! Toque em <strong>Vincular Pasta PWA</strong> para as mídias serem salvas sem abrir aquela segunda janela de prompt de salvamento do navegador.
                </span>
              ) : (
                <span>
                  No seu navegador atual, os arquivos serão catalogados na pasta virtual <strong>{customFolder || 'Downloads/UniStream'}</strong> no PWA e transferidos automaticamente via download do sistema.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {errorText && (
        <div className="mt-3 flex gap-2 items-start bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorText}</span>
        </div>
      )}
    </div>
  );
}
