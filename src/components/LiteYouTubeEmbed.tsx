// ===== src/components/LiteYouTubeEmbed.tsx =====

"use client";

import { useState, useRef } from "react";

interface LiteYouTubeEmbedProps {
  id: string; // The YouTube Video ID
  title: string;
}

export default function LiteYouTubeEmbed({ id, title }: LiteYouTubeEmbedProps) {
  const [preconnected, setPreconnected] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const warmConnections = () => {
    if (preconnected) return;
    setPreconnected(true);
  };

  const addIframe = () => {
    if (iframeLoaded) return;
    setIframeLoaded(true);
  };

  // Construct URLs for the thumbnail and iframe
  const videoUrl = `https://www.youtube-nocookie.com/embed/${id}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const iframeSrc = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;

  return (
    <>
      {/* Preconnect hints for the browser, making the iframe load faster on click */}
      {preconnected && (
        <>
          <link rel="preconnect" href="https://www.youtube-nocookie.com" />
          <link rel="preconnect" href="https://www.google.com" />
        </>
      )}

      <div
        ref={containerRef}
        onClick={addIframe}
        onPointerOver={warmConnections}
        className="relative block w-full bg-black cursor-pointer overflow-hidden"
        style={{ paddingBottom: "56.25%" }} // For a 16:9 aspect ratio
        data-title={title}
      >
        {/* The Facade: Thumbnail Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={`Play button for ${title}`}
          decoding="async"
          loading="lazy"
          className="absolute top-0 left-0 w-full h-full object-cover border-0"
        />

        {/* Fake Play Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[48px] bg-[rgba(23,23,23,0.8)] rounded-[14px] flex items-center justify-center transition-transform duration-200 ease-in-out group-hover:scale-110">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 68 48"
            aria-hidden="true"
          >
            <path
              d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
              fill="#f00"
              fillOpacity="0.8"
            ></path>
            <path d="M 45,24 27,14 27,34" fill="#fff"></path>
          </svg>
        </div>

        {/* The Real Iframe (Loaded on click) */}
        {iframeLoaded && (
          <iframe
            width="560"
            height="315"
            title={title}
            src={iframeSrc}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        )}
      </div>
    </>
  );
}
