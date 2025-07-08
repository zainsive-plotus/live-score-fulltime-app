// image-loader.js
export default function cloudflareLoader({ src, width, quality }) {
  if (src.startsWith("/")) {
    src = src.substring(1);
  }
  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality || 75}`);
  }
  const paramsString = params.join(",");

  // This must be your full R2 public URL
  return `${src}`;
}
