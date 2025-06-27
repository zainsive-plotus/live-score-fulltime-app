// src/components/MobileMatchListItem.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useVoteStorage } from "@/hooks/useVoteStorage";
import { Star, ChevronDown } from "lucide-react";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import OddsDisplay from "./OddsDisplay";

// --- Type Definitions & API Helpers ---
type Odds = { home: string; draw: string; away: string } | undefined | null;
interface VoteData {
  homeVotes: number;
  drawVotes: number;
  awayVotes: number;
}
const getVotes = async (fixtureId: number): Promise<VoteData | null> => {
  try {
    const { data } = await axios.get(`/api/votes?fixture=${fixtureId}`);
    return data;
  } catch {
    return null;
  }
};
const submitVote = async ({
  fixtureId,
  vote,
}: {
  fixtureId: number;
  vote: string;
}): Promise<VoteData> => {
  const { data } = await axios.post("/api/votes", { fixtureId, vote });
  return data;
};

// --- Reusable TeamRow sub-component ---
// --- ENHANCEMENT: It now accepts the isLive prop ---
const TeamRow = ({
  team,
  score,
  onVote,
  isVotedFor,
  isDisabled,
  isLive,
}: {
  team: { name: string; logo: string; winner: boolean };
  score: number | null;
  onVote: (e: React.MouseEvent) => void;
  isVotedFor: boolean;
  isDisabled: boolean;
  isLive: boolean; // <-- New prop
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3 min-w-0">
      <Image src={team.logo} alt={team.name} width={24} height={24} />
      <span
        className={`font-semibold text-sm truncate ${
          team.winner ? "text-text-primary" : "text-text-secondary"
        }`}
      >
        {team.name}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {/* --- FIX: The score is now conditionally colored green --- */}
      <span
        className={`font-bold text-sm ${
          isLive
            ? "text-green-400"
            : team.winner
            ? "text-text-primary"
            : "text-text-secondary"
        }`}
      >
        {score ?? "-"}
      </span>
      <button
        onClick={onVote}
        disabled={isDisabled}
        className="p-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Star
          size={20}
          className={`transition-all duration-200 ${
            isVotedFor
              ? "text-brand-yellow fill-brand-yellow"
              : "text-gray-500 hover:text-brand-yellow"
          }`}
        />
      </button>
    </div>
  </div>
);

export default function MobileMatchListItem({
  match,
  liveOdds,
}: {
  match: any;
  liveOdds?: Odds;
}) {
  const { fixture, teams, goals } = match;
  const slug = generateMatchSlug(teams.home, teams.away, fixture.id);
  const queryClient = useQueryClient();
  const { setVote, getVoteForFixture } = useVoteStorage();

  const [votedFor, setVotedFor] = useState<"home" | "away" | null>(
    () => getVoteForFixture(fixture.id) as "home" | "away" | null
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(
    fixture.status.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(fixture.status.short);

  const { data: voteData } = useQuery({
    queryKey: ["votes", fixture.id],
    queryFn: () => getVotes(fixture.id),
    enabled: !isFinished && !!votedFor,
  });

  const voteMutation = useMutation({
    mutationFn: submitVote,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["votes", fixture.id] }),
  });

  const handleVote = (e: React.MouseEvent, choice: "home" | "away") => {
    e.preventDefault();
    e.stopPropagation();
    if (votedFor || isFinished) return;
    setVotedFor(choice);
    setVote(fixture.id, choice);
    voteMutation.mutate({ fixtureId: fixture.id, vote: choice });
    if (!isExpanded) setIsExpanded(true);
  };

  const totalVotes = (voteData?.homeVotes || 0) + (voteData?.awayVotes || 0);
  const homePercent =
    totalVotes > 0
      ? Math.round(((voteData?.homeVotes || 0) / totalVotes) * 100)
      : 50;

  return (
    <div
      className="rounded-lg p-2"
      style={{ backgroundColor: "var(--color-secondary)" }}
    >
      <div className="flex items-start gap-2">
        <Link
          href={`/football/match/${slug}`}
          className="flex-1 flex items-center gap-3"
        >
          <div className="w-12 flex-shrink-0 text-center text-xs font-bold">
            {/* --- FIX: The status text is now conditionally colored green --- */}
            {isLive ? (
              <div className="flex items-center justify-center gap-1.5 text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                <span>{fixture.status.elapsed}'</span>
              </div>
            ) : isFinished ? (
              <div className="text-text-muted">FT</div>
            ) : (
              <div>{format(new Date(fixture.date), "HH:mm")}</div>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {/* --- ENHANCEMENT: Pass isLive down to the sub-component --- */}
            <TeamRow
              team={teams.home}
              score={goals.home}
              onVote={(e) => handleVote(e, "home")}
              isVotedFor={votedFor === "home"}
              isDisabled={!!votedFor || isFinished}
              isLive={isLive}
            />
            <TeamRow
              team={teams.away}
              score={goals.away}
              onVote={(e) => handleVote(e, "away")}
              isVotedFor={votedFor === "away"}
              isDisabled={!!votedFor || isFinished}
              isLive={isLive}
            />
          </div>
        </Link>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-text-muted"
        >
          <ChevronDown
            size={20}
            className={`transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 ml-14 border-t border-gray-700/50 space-y-3">
          {votedFor && (
            <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-700">
              <div
                className="bg-brand-purple"
                style={{ width: `${homePercent}%` }}
              ></div>
              <div
                className="bg-blue-600"
                style={{ width: `${100 - homePercent}%` }}
              ></div>
            </div>
          )}
          {!isFinished && (
            <OddsDisplay fixtureId={fixture.id} initialOdds={liveOdds} />
          )}
        </div>
      )}
    </div>
  );
}

// Skeleton remains unchanged.
export const MobileMatchListItemSkeleton = () => (
  <div
    className="flex items-center p-3 rounded-lg animate-pulse"
    style={{ backgroundColor: "var(--color-secondary)" }}
  >
    <div className="w-12 h-8 rounded bg-gray-600/50"></div>
    <div className="flex-1 ml-3 space-y-2">
      <div className="h-4 w-4/5 rounded bg-gray-600/50"></div>
      <div className="h-4 w-3/5 rounded bg-gray-600/50"></div>
    </div>
    <div className="w-10 h-6 rounded bg-gray-600/50"></div>
  </div>
);
