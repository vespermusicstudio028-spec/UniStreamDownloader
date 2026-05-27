export type Platform = 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'kwai' | 'generic';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  platform: Platform;
  format: 'mp4' | 'mp3' | 'txt';
  quality: string; // e.g., '1080p', '720p', '320kbps', '192kbps'
  status: 'queued' | 'downloading' | 'converting' | 'completed' | 'failed';
  progress: number; // 0 to 100
  downloadSpeed: string; // e.g., '4.5 MB/s'
  eta: string; // e.g., '0:12'
  fileSize: string; // e.g., '12.4 MB'
  timestamp: string;
  savedPath?: string; // e.g., 'UniStream/Videos/my_video.mp4'
}

export interface LiveMetrics {
  activeUsersNow: number;
  downloadsTodayCount: number;
  totalDataSavedBytes: number; // in bytes
  averageSpeedMbps: number;
}
