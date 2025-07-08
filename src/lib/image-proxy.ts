// src/lib/image-proxy.ts

// A placeholder image for when a logo is missing.
// You can create a simple SVG and place it in your /public directory.
const PLACEHOLDER_IMAGE = "/images/placeholder-logo.svg";

/**
 * Wraps an external image URL with our caching proxy.
 * Returns a placeholder if the URL is invalid or missing.
 * @param url The original external image URL.
 * @returns The proxied URL or a placeholder.
 */
export function proxyImageUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith("http")) {
    return PLACEHOLDER_IMAGE;
  }

  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
