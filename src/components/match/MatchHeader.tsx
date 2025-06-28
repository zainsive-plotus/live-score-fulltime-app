// src/components/match/MatchHeader.tsx
"use client";

import { useState } from "react"; // Import useState for the odds toggle
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "@/components/StyledLink";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { Mic, MapPin } from "lucide-react";
import { format } from "date-fns";

interface MatchHeaderProps {
  fixture: any; // The main fixture data
  analytics: any; // The analytics object, containing all prediction data
}

// --- Type Definitions for Odds (internal to this file) ---
type Odds =
  | {
      home: string;
      draw: string;
      away: string;
    }
  | undefined
  | null;

// ====================================================================
// --- ENHANCED: HeaderOdds Sub-component ---
// ====================================================================
interface HeaderOddsProps {
  fixtureId: number;
  apiPreMatchOdds?: Odds; // API pre-match odds (e.g., from API's `prediction.odds`)
  customPreMatchOdds?: Odds; // Our custom pre-match odds (from `analytics.customOdds`)
}

const HeaderOdds = ({
  apiPreMatchOdds,
  customPreMatchOdds,
}: HeaderOddsProps) => {
  // State to toggle between API and Custom Odds, defaulting to Fanskor Odds
  const [showFanskorOdds, setShowFanskorOdds] = useState(true);

  // Determine which odds to display based on the toggle
  const displayOdds = showFanskorOdds ? customPreMatchOdds : apiPreMatchOdds;

  // Add conditional coloring for the odds boxes
  const OddBox = ({
    label,
    value,
    type,
  }: {
    label: string;
    value?: string;
    type: "home" | "draw" | "away";
  }) => {
    const colorClass =
      type === "home"
        ? "bg-green-500/20 text-green-400"
        : type === "draw"
        ? "bg-yellow-500/20 text-yellow-400"
        : "bg-red-500/20 text-red-400";
    return (
      <div
        className={`flex flex-col items-center justify-center p-2 rounded-md w-16 h-14 ${colorClass}`}
      >
        <span className="text-xs text-brand-muted">{label}</span>
        <span className="text-sm font-bold text-white">{value || "-"}</span>
      </div>
    );
  };

  // Only render if there's any odds data available
  if (!apiPreMatchOdds && !customPreMatchOdds) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-2 mt-4">
      {displayOdds ? (
        <div className="flex items-center justify-center gap-2">
          <OddBox label="1" value={displayOdds.home} type="home" />
          <OddBox label="X" value={displayOdds.draw} type="draw" />
          <OddBox label="2" value={displayOdds.away} type="away" />
        </div>
      ) : (
        <div className="text-sm text-brand-muted">
          No Pre-Match Odds Available
        </div>
      )}

      {/* Odds Source Toggle/Indicator */}
      {/* Only show toggle if both API and Custom odds are present */}
      {apiPreMatchOdds && customPreMatchOdds ? (
        <button
          onClick={() => setShowFanskorOdds(!showFanskorOdds)}
          className="text-xs text-brand-muted hover:text-white transition-colors mt-2"
        >
          Showing:{" "}
          <span className="font-semibold text-brand-purple">
            {showFanskorOdds ? "Fanskor Odds" : "API Odds"}
          </span>{" "}
          (Click to switch)
        </button>
      ) : (
        // Show source if only one type of odds is available
        <p className="text-xs text-brand-muted mt-2">
          {apiPreMatchOdds
            ? "Source: API"
            : customPreMatchOdds
            ? "Source: Fanskor"
            : ""}
        </p>
      )}
    </div>
  );
};

// ====================================================================
// --- MAIN MatchHeader Component ---
// ====================================================================
export default function MatchHeader({
  fixture: matchData,
  analytics,
}: MatchHeaderProps) {
  // Correctly destructure the necessary parts of fixture and analytics
  const { league, teams, fixture: details, goals } = matchData;
  const { venue, referee, id: fixtureId, status } = details;

  const { prediction: apiPrediction, customOdds: customPreMatchOdds } =
    analytics;

  // Determine if the match is live or finished for score/time display
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    status.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(status.short);

  // Render the score or time in the center
  const renderCentralScoreOrTime = () => {
    if (isLive) {
      return (
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400">
            <span>{goals.home}</span> - <span>{goals.away}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-lg text-green-400 mt-1">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>{status.elapsed}'</span>
          </div>
        </div>
      );
    }
    if (isFinished) {
      return (
        <div className="text-center">
          <div className="text-4xl font-bold text-white">
            <span>{goals.home}</span> - <span>{goals.away}</span>
          </div>
          <span className="text-lg text-brand-muted">{status.short}</span>
        </div>
      );
    }
    // Upcoming match: display kick-off time
    return (
      <div className="text-center">
        <div className="text-3xl font-bold text-white">
          {format(new Date(details.date), "HH:mm")}
        </div>
        <span className="text-lg text-brand-muted">
          {format(new Date(details.date), "dd MMM")}
        </span>
      </div>
    );
  };

  return (
    <header className="bg-brand-secondary p-4 md:p-6 rounded-lg shadow-lg relative overflow-hidden">
      {/* Optional: Subtle background image of the stadium for atmosphere */}
      {venue?.image && (
        <div className="absolute inset-0 opacity-5">
          <Image
            src={proxyImageUrl(venue.image)}
            alt={`${venue.name} background`}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10">
        {/* Top Row: League & Round Info */}
        <div className="flex justify-between items-center text-sm text-brand-muted mb-4">
          <StyledLink
            href={generateLeagueSlug(league.name, league.id)}
            className="flex items-center gap-2 group"
          >
            <Image
              src={proxyImageUrl(league.logo)}
              alt={league.name}
              width={20}
              height={20}
            />
            <span className="font-semibold group-hover:text-white transition-colors">
              {league.name}
            </span>
          </StyledLink>
          <span>{league.round}</span>
        </div>

        {/* Middle Row: Team Matchup and Score */}
        <div className="grid grid-cols-3 items-center gap-4 text-white">
          {/* Home Team */}
          <StyledLink
            href={generateTeamSlug(teams.home.name, teams.home.id)}
            className="flex flex-col items-center text-center gap-2"
          >
            <Image
              src={proxyImageUrl(teams.home.logo)}
              alt={teams.home.name}
              width={80}
              height={80}
            />
            <h2 className="text-lg md:text-xl font-bold">{teams.home.name}</h2>
          </StyledLink>

          {/* Central Score/Time Display */}
          <div className="text-center">{renderCentralScoreOrTime()}</div>

          {/* Away Team */}
          <StyledLink
            href={generateTeamSlug(teams.away.name, teams.away.id)}
            className="flex flex-col items-center text-center gap-2"
          >
            <Image
              src={proxyImageUrl(teams.away.logo)}
              alt={teams.away.name}
              width={80}
              height={80}
            />
            <h2 className="text-lg md:text-xl font-bold">{teams.away.name}</h2>
          </StyledLink>
        </div>

        {/* Odds Display */}
        {/* Pass the pre-match odds from the analytics object to the HeaderOdds component */}
        <HeaderOdds
          fixtureId={fixtureId}
          apiPreMatchOdds={apiPrediction?.odds}
          customPreMatchOdds={customPreMatchOdds}
        />

        {/* Bottom Row: Venue & Referee Info */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-2 text-xs text-brand-muted mt-6 text-center">
          {venue?.name && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} />
              <span>
                {venue.name}, {venue.city}
              </span>
            </div>
          )}
          {referee && (
            <div className="flex items-center gap-1.5">
              <Mic size={12} />
              <span>Referee: {referee}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
