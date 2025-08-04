// ===== src/components/HighlightSlide.tsx =====

import LiteYouTubeEmbed from "./LiteYouTubeEmbed"; // Import the new facade component

interface Highlight {
  id: string;
  embedUrl: string;
  title: string;
}

interface HighlightSlideProps {
  highlight: Highlight;
}

// Function to extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function HighlightSlide({ highlight }: HighlightSlideProps) {
  const videoId = getYouTubeId(highlight.embedUrl);

  // If we can't get a video ID, we can't use the facade.
  // As a fallback, we can either render nothing or the original iframe.
  // Here, we'll render nothing to guarantee performance.
  if (!videoId) {
    return null;
  }

  return (
    // Replace the heavy iframe with our new lightweight facade component
    <LiteYouTubeEmbed id={videoId} title={highlight.title} />
  );
}
