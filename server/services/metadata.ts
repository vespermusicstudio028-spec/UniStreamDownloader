import youtubedl from 'youtube-dl-exec';
import { logger } from '../utils/logger.js';

export interface MediaInfo {
  title: string;
  uploader: string;
  duration: number; // seconds
  thumbnailUrl: string;
  platform: string;
  formats: FormatOption[];
  description?: string;
}

export interface FormatOption {
  id: string;
  ext: string;
  quality: string;
  resolution?: string;
  filesize?: number;
  label: string;
}

function detectPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
  if (url.includes('kwai.com')) return 'Kwai';
  if (url.includes('vimeo.com')) return 'Vimeo';
  if (url.includes('reddit.com')) return 'Reddit';
  return 'Web';
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export async function getMediaInfo(url: string): Promise<MediaInfo> {
  logger.info('Metadata', `Extraindo metadados para: ${url}`);

  try {
    const info = await (youtubedl as any)(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
    }) as any;

    logger.info('Metadata', `Metadados extraídos: "${info.title}"`);

    // Build format options
    const videoFormats: FormatOption[] = [];
    const seenQualities = new Set<string>();

    const qualityOrder = ['2160', '1440', '1080', '720', '480', '360', '240', '144'];
    
    if (Array.isArray(info.formats)) {
      for (const fmt of info.formats) {
        if (!fmt.vcodec || fmt.vcodec === 'none') continue;
        const h = fmt.height;
        if (!h) continue;
        const label = `${h}p`;
        if (seenQualities.has(label)) continue;
        if (!qualityOrder.some(q => String(h).startsWith(q))) continue;
        seenQualities.add(label);
        videoFormats.push({
          id: fmt.format_id,
          ext: 'mp4',
          quality: label,
          resolution: `${fmt.width}x${fmt.height}`,
          filesize: fmt.filesize,
          label: `${label}${h >= 1080 ? ' Full HD' : h >= 720 ? ' HD' : ''}`,
        });
      }
    }

    // Sort by quality descending
    videoFormats.sort((a, b) => {
      const qa = parseInt(a.quality) || 0;
      const qb = parseInt(b.quality) || 0;
      return qb - qa;
    });

    // Fallback if no formats detected
    if (videoFormats.length === 0) {
      for (const q of ['1080p Full HD', '720p HD', '480p', '360p']) {
        videoFormats.push({ id: q, ext: 'mp4', quality: q.split('p')[0]+'p', label: q });
      }
    }

    return {
      title: info.title || 'Vídeo sem título',
      uploader: info.uploader || info.channel || info.creator || '@creator',
      duration: typeof info.duration === 'number' ? info.duration : 0,
      thumbnailUrl: info.thumbnail || '',
      platform: detectPlatform(url),
      formats: videoFormats,
      description: info.description?.substring(0, 200),
    };
  } catch (err: any) {
    logger.error('Metadata', `Falha ao extrair metadados via yt-dlp`, { error: err.message });
    
    // Fallback to oEmbed for YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (oembedRes.ok) {
          const oembed = await oembedRes.json() as any;
          return {
            title: oembed.title || 'Vídeo do YouTube',
            uploader: oembed.author_name || '@youtube',
            duration: 0,
            thumbnailUrl: oembed.thumbnail_url || '',
            platform: 'YouTube',
            formats: [
              { id: '1080', ext: 'mp4', quality: '1080p', label: '1080p Full HD' },
              { id: '720', ext: 'mp4', quality: '720p', label: '720p HD' },
              { id: '480', ext: 'mp4', quality: '480p', label: '480p' },
              { id: '360', ext: 'mp4', quality: '360p', label: '360p' },
            ],
          };
        }
      } catch {
        // ignore
      }
    }

    // Generic fallback
    const platform = detectPlatform(url);
    return {
      title: `Vídeo de ${platform}`,
      uploader: `@${platform.toLowerCase()}`,
      duration: 0,
      thumbnailUrl: '',
      platform,
      formats: [
        { id: '1080', ext: 'mp4', quality: '1080p', label: '1080p Full HD' },
        { id: '720', ext: 'mp4', quality: '720p', label: '720p HD' },
        { id: '480', ext: 'mp4', quality: '480p', label: '480p' },
        { id: '360', ext: 'mp4', quality: '360p', label: '360p' },
      ],
    };
  }
}
