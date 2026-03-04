// src/lib/avatarUrl.js

/**
 * Safely resolves an avatar URL:
 * - Forces https (fixes Vercel mixed-content block)
 * - Returns null if empty/undefined (prevents broken <img src="">)
 */
export function safeAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
}

/**
 * Common props to spread onto every <img> used as an avatar.
 * Prevents Google/Cloudinary 403s and handles broken URLs.
 */
export function avatarImgProps(url, name = 'User', onError) {
  return {
    src:            safeAvatarUrl(url),
    alt:            `${name} avatar`,
    referrerPolicy: 'no-referrer',
    onError:        onError ?? ((e) => { e.target.style.display = 'none'; }),
  };
}