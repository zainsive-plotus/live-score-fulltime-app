"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { PlayCircle, Goal, Calendar } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";

// Updated interface to reflect that nested data can be missing
interface Highlight {
  id: number;
  imgUrl: string | null;
  title: string;
  description?: string;
  url: string;
  source: string;
  match?: {
    date?: string;
    country?: { name?: string; logo?: string };
    awayTeam?: { name?: string; logo?: string };
    homeTeam?: { name?: string; logo?: string };
    league?: { name?: string; logo?: string };
  };
}

const HighlightCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-xl animate-pulse">
    <div className="aspect-video w-full bg-gray-700/50 rounded-t-xl"></div>
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-gray-600"></div>
        <div className="h-4 w-1/3 bg-gray-600 rounded"></div>
      </div>
      <div className="h-5 w-full bg-gray-600 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-600 rounded"></div>
      <div className="h-3 w-1/2 bg-gray-700 rounded mt-2"></div>
    </div>
  </div>
);

export default function HighlightCard({ highlight }: { highlight: Highlight }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Safely destructure with fallbacks to prevent crashes
  const { match = {} } = highlight;
  const { league = {}, homeTeam = {}, awayTeam = {} } = match;

  const homeTeamName = homeTeam?.name ?? t("home_team");
  const awayTeamName = awayTeam?.name ?? t("away_team");
  const leagueName = league?.name ?? t("match_highlight");

  const matchDate = match?.date ? new Date(match.date) : null;
  const isDateValid = matchDate && isValid(matchDate);

  const thumbnailUrl =
    proxyImageUrl(highlight.imgUrl) ||
    proxyImageUrl(league?.logo) ||
    "/images/placeholder-logo.svg";

  // ** NEW: Logic to create an embed URL for specific providers **
  const embedUrl = useMemo(() => {
    if (highlight.url && highlight.url.includes("streamain.com")) {
      const parts = highlight.url.split("/");
      // The unique video ID is typically the second to last part of the path
      const videoId = parts[parts.length - 2];
      if (videoId) {
        return `https://streamain.com/embed/${videoId}`;
      }
    }
    // Return null for other providers to trigger fallback behavior
    return null;
  }, [highlight.url]);

  // ** NEW: Click handler to decide whether to open modal or new tab **
  const handleClick = () => {
    if (embedUrl) {
      setIsModalOpen(true);
    } else if (highlight.url) {
      window.open(highlight.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="block bg-brand-secondary rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-[var(--brand-accent)]/20 hover:-translate-y-1 border border-gray-800/50 hover:border-[var(--brand-accent)]/30"
      >
        <div className="relative aspect-video w-full">
          <Image
            src={thumbnailUrl}
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
          {(homeTeam?.logo || awayTeam?.logo) && (
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-1 pr-2 rounded-full">
              {homeTeam.logo && (
                <Image
                  src={proxyImageUrl(homeTeam.logo)}
                  alt={homeTeamName}
                  width={24}
                  height={24}
                />
              )}
              {awayTeam.logo && (
                <Image
                  src={proxyImageUrl(awayTeam.logo)}
                  alt={awayTeamName}
                  width={24}
                  height={24}
                />
              )}
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          {leagueName && (
            <div className="flex items-center gap-2">
              {league.logo && (
                <Image
                  src={proxyImageUrl(league.logo)}
                  alt={leagueName}
                  width={16}
                  height={16}
                />
              )}
              <span className="text-xs font-bold text-text-muted truncate">
                {leagueName}
              </span>
            </div>
          )}
          <h3 className="font-bold text-white leading-tight line-clamp-2 text-base group-hover:text-[var(--brand-accent)] transition-colors">
            {homeTeamName} vs {awayTeamName}
          </h3>
          {highlight.description && (
            <div className="flex items-center gap-2 text-sm text-brand-light bg-brand-dark/30 px-2 py-1 rounded-md">
              <Goal
                size={16}
                className="text-[var(--brand-accent)] flex-shrink-0"
              />
              <p className="truncate">{highlight.description}</p>
            </div>
          )}
          {isDateValid && (
            <div className="flex items-center gap-2 text-xs text-text-muted pt-1">
              <Calendar size={12} />
              <time dateTime={matchDate.toISOString()}>
                {formatDistanceToNow(matchDate, { addSuffix: true })}
              </time>
            </div>
          )}
        </div>
      </div>

      {/* ** NEW: Lightbox Modal for Video Playback ** */}
      {isModalOpen && embedUrl && (
        <div
          className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50">
              <iframe
                src={`${embedUrl}?autoplay=1`}
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
