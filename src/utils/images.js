/**
 * ImageKit resizes on the fly from URL parameters. A product card that shows an
 * image 300px wide only needs ~300-600px, not the 3000px original.
 * https://imagekit.io/docs/image-resize-and-crop
 *
 * Only ImageKit URLs are changed; other links are returned as they are.
 * Set VITE_IMAGEKIT_ENDPOINT if you use a custom domain for ImageKit.
 */
const CUSTOM_ENDPOINT = (import.meta.env.VITE_IMAGEKIT_ENDPOINT || '').replace(/\/+$/, '');

export function isImageKitUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (CUSTOM_ENDPOINT && url.startsWith(CUSTOM_ENDPOINT)) return true;
  try {
    const host = new URL(url).hostname;
    return host === 'ik.imagekit.io' || host.endsWith('.imagekit.io');
  } catch {
    return false;
  }
}

/** Adds ?tr=w-<width>,f-auto (resize + best format for the browser) to ImageKit URLs. */
export function imageUrl(url, width) {
  if (!isImageKitUrl(url) || !width) return url;
  // Leave URLs that already carry transformations alone.
  if (/[?&]tr=|\/tr:/.test(url)) return url;
  const w = Math.max(16, Math.round(width));
  return `${url}${url.includes('?') ? '&' : '?'}tr=w-${w},f-auto`;
}
