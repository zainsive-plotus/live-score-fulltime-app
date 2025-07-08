// src/lib/image-proxy.ts

// A placeholder image for when a logo is missing or the URL is invalid.
// You can create this file in your /public/images/ directory.
const PLACEHOLDER_IMAGE = "/images/placeholder-logo.svg";

/**
 * Validates an image URL. If it's a valid remote or local URL, it returns it directly.
 * Otherwise, it returns a placeholder.
 * @param url The original image URL.
 * @returns The direct, valid URL or a placeholder.
 */
export function proxyImageUrl(url: string | null | undefined): string {
  // If the URL is valid and starts with http or is a local path, return it directly.
  if (url && (url.startsWith("http") || url.startsWith("/"))) {
    return url;
  }

  // Otherwise, return the placeholder.
  return PLACEHOLDER_IMAGE;
}
