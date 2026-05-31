// All TypeScript types for UniStream Pro
export type Platform =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'kwai'
  | 'vimeo'
  | 'reddit'
  | 'web'
  | 'generic';

export type DownloadFormat = 'mp4' | 'mp3' | 'txt';
export type DownloadStatus = 'queued' | 'downloading' | 'converting' | 'validating' | 'finalizing' | 'done' | 'error';

export interface FormatOption {
  id: string;
  ext: string;
  quality: string;
  resolution?: string;
  filesize?: number;
  label: string;
}

export interface MediaInfo {
  title: string;
  uploader: string;
  duration: number; // seconds
  thumbnailUrl: string;
  platform: string;
  formats: FormatOption[];
  description?: string;
}

export interface DownloadJob {
  id: string;
  url: string;
  title: string;
  uploader: string;
  thumbnailUrl: string;
  platform: Platform;
  format: DownloadFormat;
  quality: string;
  status: DownloadStatus;
  progress: number;
  speed: string;
  eta: string;
  message: string;
  filePath?: string;
  filename?: string;
  error?: string;
  fileSize: string;
  createdAt: number;
  isFavorite?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  body?: string;
  duration?: number;
}

export interface LiveMetrics {
  activeUsersNow: number;
  downloadsTodayCount: number;
  totalDataSavedBytes: number;
  averageSpeedMbps: number;
}
