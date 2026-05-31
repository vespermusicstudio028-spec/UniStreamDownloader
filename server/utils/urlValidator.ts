/**
 * URL validation utility.
 * Blocks SSRF attempts, private IPs, and unsupported protocols.
 */

const SUPPORTED_PLATFORMS = [
  'youtube.com', 'youtu.be',
  'instagram.com',
  'tiktok.com',
  'facebook.com', 'fb.watch',
  'twitter.com', 'x.com',
  'kwai.com',
  'vimeo.com',
  'reddit.com', 'v.redd.it',
  'dailymotion.com',
  'twitch.tv',
  'soundcloud.com',
];

const PRIVATE_IP_RANGES = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^0\.0\.0\.0/,
];

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  platform?: string;
}

export function validateUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'URL não fornecida.' };
  }

  const trimmed = rawUrl.trim();

  // Protocol check
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, reason: 'URL deve começar com http:// ou https://' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'URL malformada ou inválida.' };
  }

  // Block private/internal IPs (SSRF protection)
  const hostname = parsed.hostname;
  for (const pattern of PRIVATE_IP_RANGES) {
    if (pattern.test(hostname)) {
      return { valid: false, reason: 'URL aponta para endereço interno não permitido.' };
    }
  }

  // Find supported platform
  const matchedPlatform = SUPPORTED_PLATFORMS.find((p) =>
    hostname.includes(p) || hostname.endsWith(p)
  );

  if (!matchedPlatform) {
    // Allow generic URLs but flag as 'web'
    return { valid: true, platform: 'web' };
  }

  const platformName = matchedPlatform.split('.')[0];
  return { valid: true, platform: platformName };
}
