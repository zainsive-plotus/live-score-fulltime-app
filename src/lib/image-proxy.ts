// src/lib/image-proxy.ts

// A placeholder image for when a logo is missing or the URL is invalid.
const PLACEHOLDER_IMAGE = "/images/placeholder-logo.svg";

/**
 * Wraps an external image URL with our caching proxy API route.
 * Returns a placeholder if the URL is invalid or missing.
 * @param url The original external image URL.
 * @returns The proxied URL or a placeholder.
 */
export function proxyImageUrl(url: string | null | undefined): string {
  // If the URL is invalid or missing, return the placeholder.
  if (!url || !url.startsWith("http")) {
    return PLACEHOLDER_IMAGE;
  }

  // Otherwise, construct the URL for our internal API proxy.
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
