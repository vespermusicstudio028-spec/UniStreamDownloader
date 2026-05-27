import { Platform } from './types';

export function detectPlatform(url: string): Platform {
  const normalizedUrl = url.toLowerCase().trim();
  if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) return 'youtube';
  if (normalizedUrl.includes('instagram.com')) return 'instagram';
  if (normalizedUrl.includes('facebook.com') || normalizedUrl.includes('fb.watch')) return 'facebook';
  if (normalizedUrl.includes('tiktok.com')) return 'tiktok';
  if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) return 'twitter';
  if (normalizedUrl.includes('kwai.com') || normalizedUrl.includes('kwaishow.com')) return 'kwai';
  return 'generic';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function estimateFileSize(format: 'mp4' | 'mp3' | 'txt', quality: string, durationSeconds: number = 180): string {
  // Rough estimate of file size
  if (format === 'txt') {
    return '12.5 KB';
  }
  if (format === 'mp3') {
    const kbps = parseInt(quality) || 192;
    const sizeInBytes = (kbps * 1000 * durationSeconds) / 8;
    return formatBytes(sizeInBytes);
  } else {
    // MP4
    let multiplier = 1.5; // Default for 360p/480p
    if (quality.includes('1080p')) multiplier = 8.5;
    else if (quality.includes('720p')) multiplier = 4.5;
    else if (quality.includes('480p')) multiplier = 2.5;
    const sizeInBytes = multiplier * 1024 * 1024 * (durationSeconds / 60) * 10;
    return formatBytes(sizeInBytes);
  }
}

export function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'youtube':
      return 'text-red-500 bg-red-500/10';
    case 'instagram':
      return 'text-pink-500 bg-pink-500/10';
    case 'facebook':
      return 'text-blue-500 bg-blue-500/10';
    case 'tiktok':
      return 'text-cyan-400 bg-cyan-400/10';
    case 'twitter':
      return 'text-slate-100 bg-slate-100/10';
    case 'kwai':
      return 'text-orange-500 bg-orange-500/10';
    default:
      return 'text-indigo-500 bg-indigo-500/10';
  }
}
