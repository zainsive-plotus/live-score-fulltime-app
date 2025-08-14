// ===== src/components/HighlightCard.tsx =====

"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayCircle, Youtube, Film } from "lucide-react";

interface Highlight {
  id: string;
  title: string;
  thumbnailUrl: string;
  embedUrl: string;
  source: "Highlightly" | "YouTube";
  publishedAt: string;
}

const HighlightCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg animate-pulse">
    <div className="aspect-video w-full bg-gray-700/50 rounded-t-lg"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 w-1/4 bg-gray-600 rounded"></div>
      <div className="h-5 w-full bg-gray-600 rounded"></div>
      <div className="h-5 w-4/5 bg-gray-600 rounded"></div>
    </div>
  </div>
);

export default function HighlightCard({ highlight }: { highlight: Highlight }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const SourceIcon = highlight.source === "YouTube" ? Youtube : Film;
  const sourceColor =
    highlight.source === "YouTube" ? "text-red-500" : "text-blue-400";

  return (
    <>
      <div
        className="bg-brand-secondary rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-[var(--brand-accent)]/20 hover:-translate-y-1"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative aspect-video w-full">
          <Image
            src={highlight.thumbnailUrl}
            alt={highlight.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-opacity flex items-center justify-center">
            <PlayCircle
              size={64}
              className="text-white/80 group-hover:text-white group-hover:scale-110 transition-transform duration-300"
              strokeWidth={1.5}
            />
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <SourceIcon size={16} className={sourceColor} />
            <span className={`text-xs font-bold uppercase ${sourceColor}`}>
              {highlight.source}
            </span>
          </div>
          <h3 className="font-bold text-white leading-tight line-clamp-2">
            {highlight.title}
          </h3>
        </div>
      </div>

      {/* Video Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <iframe
                src={`${highlight.embedUrl}?autoplay=1`}
                title={highlight.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { HighlightCardSkeleton };
