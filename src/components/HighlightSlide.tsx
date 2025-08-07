// ===== src/components/HighlightSlide.tsx =====

"use client";

import LiteYouTubeEmbed from "./LiteYouTubeEmbed";

interface Highlight {
  id: string;
  embedUrl: string | null | undefined; // Acknowledge that the URL can be null
  title: string;
}

interface HighlightSlideProps {
  highlight: Highlight;
}

function getYouTubeId(url: string | null | undefined): string | null {
  // --- THIS IS THE FIX ---
  // If the URL is null, undefined, or not a string, return null immediately.
  if (!url || typeof url !== "string") {
    return null;
  }
  // --- END OF FIX ---

  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function HighlightSlide({ highlight }: HighlightSlideProps) {
  const videoId = getYouTubeId(highlight.embedUrl);

  // If we can't extract a valid video ID, we render nothing for this slide.
  // This prevents the entire widget from crashing.
  if (!videoId) {
    return null;
  }

  return <LiteYouTubeEmbed id={videoId} title={highlight.title} />;
}
