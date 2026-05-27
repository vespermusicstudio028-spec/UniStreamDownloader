import { useState, useEffect } from 'react';
import { Users, DownloadCloud, HardDrive, Cpu, ArrowUpRight } from 'lucide-react';
import { LiveMetrics } from '../types';

export default function MetricsPanel() {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    activeUsersNow: 1247,
    downloadsTodayCount: 34892,
    totalDataSavedBytes: 15478492049012, // ~14.07 TB
    averageSpeedMbps: 852.4
  });

  // Smoothly fluctuate rates for real-time live feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const userFluctuation = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newUsers = Math.max(900, prev.activeUsersNow + userFluctuation);

        const newDownloads = prev.downloadsTodayCount + (Math.random() > 0.3 ? 1 : 0);
        
        // Add random download size fluctuation if download happened
        const dataAdded = Math.random() > 0.3 ? Math.floor(Math.random() * 15 * 1024 * 1024) : 0;
        
        const speedFluctuation = parseFloat((Math.random() * 10 - 5).toFixed(1));
        const newSpeed = Math.min(1000, Math.max(600, prev.averageSpeedMbps + speedFluctuation));

        return {
          activeUsersNow: newUsers,
          downloadsTodayCount: newDownloads,
          totalDataSavedBytes: prev.totalDataSavedBytes + dataAdded,
          averageSpeedMbps: newSpeed
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Format bytes for display
  const formatTerabytes = (bytes: number) => {
    const tb = bytes / (1024 * 1024 * 1024 * 1024);
    return tb.toFixed(4) + ' TB';
  };

  return (
    <div id="metrics-container" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Active Users */}
      <div 
        id="metric-card-users" 
        className="relative overflow-hidden glass-card p-5 transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg hover:shadow-cyan-400/10"
      >
        <div className="flex justify-between items-start">
          <div className="p-2 bg-cyan-400/10 rounded-xl text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            AO VIVO <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-white tracking-tight font-sans transition-all">
            {metrics.activeUsersNow.toLocaleString()}
          </h3>
          <p className="text-xs text-white/50 mt-1">Usuários Ativos Agora</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-50" />
      </div>

      {/* Card 2: Downloads today */}
      <div 
        id="metric-card-downloads" 
        className="relative overflow-hidden glass-card p-5 transition-all duration-300 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10"
      >
        <div className="flex justify-between items-start">
          <div className="p-2 bg-pink-500/10 rounded-xl text-pink-400">
            <DownloadCloud className="w-5 h-5" />
          </div>
          <span className="flex items-center text-[10px] font-mono text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">
            +{(Math.random() * 2 + 1).toFixed(1)}/s
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-white tracking-tight font-sans">
            {metrics.downloadsTodayCount.toLocaleString()}
          </h3>
          <p className="text-xs text-white/50 mt-1">Downloads Concluídos Hoje</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-400 opacity-50" />
      </div>

      {/* Card 3: Storage saved */}
      <div 
        id="metric-card-storage" 
        className="relative overflow-hidden glass-card p-5 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
      >
        <div className="flex justify-between items-start">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            Global
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-white tracking-tight font-sans">
            {formatTerabytes(metrics.totalDataSavedBytes)}
          </h3>
          <p className="text-xs text-white/50 mt-1">Largura de Banda Economizada</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-400 opacity-50" />
      </div>

      {/* Card 4: Global server speed */}
      <div 
        id="metric-card-speed" 
        className="relative overflow-hidden glass-card p-5 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10"
      >
        <div className="flex justify-between items-start">
          <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
            Pico: 950M
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-white tracking-tight font-sans">
            {metrics.averageSpeedMbps.toFixed(1)} Mbps
          </h3>
          <p className="text-xs text-white/50 mt-1">Velocidade Média de Tráfego</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-50" />
      </div>
    </div>
  );
}
