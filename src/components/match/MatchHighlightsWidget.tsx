// ===== src/components/match/MatchHighlightsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { PlayCircle, Film, Info, X } from "lucide-react";

// Types based on expected Highlightly API response (adjust if needed)
interface Highlight {
  id: string;
  title: string;
  thumbnailUrl: string;
  embedUrl: string; // URL for the iframe player
  source: string;
}

interface MatchHighlightsWidgetProps {
  fixtureId: string;
}

const fetchHighlights = async (
  fixtureId: string
): Promise<Highlight[] | null> => {
  try {
    const { data } = await axios.get(`/api/highlights?fixtureId=${fixtureId}`);
    // Assuming the API returns an object with a 'highlights' array
    return data?.highlights || data || null;
  } catch (error) {
    console.error(
      `[Highlights Widget] Failed to fetch highlights for fixture ${fixtureId}`,
      error
    );
    return null;
  }
};

const HighlightSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 animate-pulse">
    <div className="h-6 w-3/4 rounded bg-gray-700 mb-4"></div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="h-24 bg-gray-700/50 rounded-lg"></div>
      <div className="h-24 bg-gray-700/50 rounded-lg"></div>
      <div className="h-24 bg-gray-700/50 rounded-lg"></div>
    </div>
  </div>
);

const VideoPlayerModal = ({
  embedUrl,
  title,
  onClose,
}: {
  embedUrl: string;
  title: string;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in"
    onClick={onClose}
  >
    <div
      className="bg-brand-dark rounded-lg w-full max-w-4xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="font-bold text-white truncate">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 text-brand-muted hover:text-white"
        >
          <X size={24} />
        </button>
      </div>
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    </div>
  </div>
);

export default function MatchHighlightsWidget({
  fixtureId,
}: MatchHighlightsWidgetProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(
    null
  );

  const {
    data: highlights,
    isLoading,
    isError,
  } = useQuery<Highlight[] | null>({
    queryKey: ["matchHighlights", fixtureId],
    queryFn: () => fetchHighlights(fixtureId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    enabled: !!fixtureId,
  });

  if (isLoading) {
    return <HighlightSkeleton />;
  }

  if (isError || !highlights || highlights.length === 0) {
    // Return null to not render the widget if there are no highlights
    return null;
  }

  return (
    <>
      <div className="bg-brand-secondary rounded-lg shadow-lg">
        <div className="p-4 md:p-6 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Film size={22} className="text-brand-purple" /> Match Highlights
          </h2>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {highlights.map((highlight) => (
            <button
              key={highlight.id}
              onClick={() => setSelectedHighlight(highlight)}
              className="block group relative rounded-lg overflow-hidden cursor-pointer"
            >
              <img
                src={highlight.thumbnailUrl}
                alt={highlight.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                <PlayCircle
                  size={40}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300"
                />
                <p className="font-semibold text-white text-sm text-left line-clamp-2">
                  {highlight.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      {selectedHighlight && (
        <VideoPlayerModal
          embedUrl={selectedHighlight.embedUrl}
          title={selectedHighlight.title}
          onClose={() => setSelectedHighlight(null)}
        />
      )}
    </>
  );
}
