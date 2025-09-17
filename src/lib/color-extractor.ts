// ===== src/lib/color-extractor.ts =====
"use client";

import { useColor } from "color-thief-react";
import { proxyImageUrl } from "./image-proxy";

// A custom hook to safely extract the dominant color from a team logo
export const useTeamColor = (logoUrl: string) => {
  const proxiedUrl = proxyImageUrl(logoUrl);

  const {
    data: dominantColor,
    loading,
    error,
  } = useColor(proxiedUrl, "hex", {
    crossOrigin: "anonymous",
    quality: 10,
  });

  if (loading || error || !dominantColor) {
    // Return a safe, neutral fallback color
    return "#4a5568"; // A medium gray
  }

  return dominantColor;
};
