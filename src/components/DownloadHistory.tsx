import React from 'react';
import { DownloadItem } from '../types';
import { 
  CheckCircle2, XCircle, Clock, Loader2, ArrowDownToLine, 
  Trash2, FolderOpen, PlaySquare 
} from 'lucide-react';

interface DownloadHistoryProps {
  items: DownloadItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onDownloadFile: (item: DownloadItem) => void;
  customFolder: string;
}

export default function DownloadHistory({
  items,
  onRemoveItem,
  onClearAll,
  onDownloadFile,
  customFolder
}: DownloadHistoryProps) {
  
  if (items.length === 0) return null;

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
            <ArrowDownToLine className="w-5 h-5 text-indigo-400" />
            Fila & Histórico de Downloads
          </h3>
          <p className="text-sm text-slate-400">Acompanhe o progresso de extração de vídeo/áudio em tempo real.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors font-mono cursor-pointer"
          >
            Limpar Histórico
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl relative transition-all hover:border-slate-700 w-full"
          >
            {/* Status icon side */}
            <div className="hidden sm:flex shrink-0">
              {item.status === 'completed' ? (
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                </div>
              ) : item.status === 'failed' ? (
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
              ) : item.status === 'queued' ? (
                <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Content Core details */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h4 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[300px]">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize border border-slate-700">
                    {item.format} / {item.quality} / {item.fileSize}
                  </span>
                </div>
              </div>

              {/* Progress bar and metrics */}
              {item.status !== 'failed' && (
                <div className="mt-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5 font-mono text-[10px]">
                    <span className="capitalize text-teal-300">{item.status === 'completed' ? 'Finalizado' : item.status}</span>
                    {item.status !== 'completed' && item.status !== 'queued' && (
                      <div className="flex gap-3">
                        <span>{item.downloadSpeed}</span>
                        <span>Restante: {item.eta}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'completed' ? 'bg-teal-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions CTA Section */}
            <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto shrink-0 border-t border-slate-800/60 sm:border-t-0 pt-3 sm:pt-0">
              {item.status === 'completed' && (
                <button
                  onClick={() => onDownloadFile(item)}
                  className="flex-1 sm:flex-none uppercase text-[10px] font-bold bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 hover:border-teal-500/40 px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Salvar
                </button>
              )}

              <button
                onClick={() => onRemoveItem(item.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 cursor-pointer"
                title="Remover do histórico"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
