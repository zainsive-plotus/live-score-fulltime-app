// ===== src/components/MobileLiveMatchCard.tsx =====

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { format } from "date-fns";
import Link from "@/components/StyledLink";
import { History, ChevronDown, BarChart2 } from "lucide-react";
import VotingPanel from "./VotingPanel";
import { useTranslation } from "@/hooks/useTranslation";
import { generateMatchSlug } from "@/lib/generate-match-slug";

interface MatchCardProps {
  match: any;
}

const TeamRow = ({ team, score, hasMomentum, momentumType }: any) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative flex-shrink-0">
        <Image
          src={team.logo}
          alt={team.name}
          width={32}
          height={32}
          className="object-contain h-8 w-8"
        />
        {hasMomentum && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${
                momentumType === "Goal" ? "bg-green-400" : "bg-red-400"
              } opacity-75 animate-ping`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                momentumType === "Goal" ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
          </span>
        )}
      </div>
      <span className="font-bold text-white truncate">{team.name}</span>
    </div>
    <span className="text-xl font-black text-white">{score ?? 0}</span>
  </div>
);

export default function MobileLiveMatchCard({ match }: MatchCardProps) {
  const { fixture, teams, goals, league, events } = match;
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();
  const slug = generateMatchSlug(teams.home, teams.away, fixture.id);

  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(fixture.status.short);
  const isFinished = ["FT", "AET", "PEN"].includes(fixture.status.short);
  const isUpcoming = !isLive && !isFinished;

  const momentumData = useMemo(() => {
    if (!isLive || !events || events.length === 0)
      return { teamId: null, type: null };
    const lastMajorEvent = [...events]
      .reverse()
      .find(
        (e) =>
          e.type === "Goal" || (e.type === "Card" && e.detail === "Red Card")
      );
    if (!lastMajorEvent) return { teamId: null, type: null };
    let momentumTeamId = lastMajorEvent.team.id;
    if (lastMajorEvent.type === "Card") {
      momentumTeamId =
        momentumTeamId === teams.home.id ? teams.away.id : teams.home.id;
    }
    return { teamId: momentumTeamId, type: lastMajorEvent.type };
  }, [events, isLive, teams.home.id, teams.away.id]);

  return (
    <div className="bg-[#252837] rounded-xl overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src={league.logo}
            alt={league.name}
            width={20}
            height={20}
            className="flex-shrink-0"
          />
          <span className="text-sm font-semibold truncate text-brand-muted">
            {league.name}
          </span>
        </div>
        <div className="flex-shrink-0">
          {isLive && (
            <div className="flex items-center gap-1.5 text-brand-live font-semibold text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-live"></span>
              </span>
              <span>{fixture.status.elapsed}'</span>
            </div>
          )}
          {isFinished && (
            <div className="flex items-center gap-1.5 bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full text-xs font-semibold">
              <History size={12} />
              <span>{t("finished")}</span>
            </div>
          )}
          {isUpcoming && (
            <div className="font-bold text-brand-light text-sm">
              {format(new Date(fixture.date), "HH:mm")}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <TeamRow
          team={teams.home}
          score={goals.home}
          hasMomentum={momentumData.teamId === teams.home.id}
          momentumType={momentumData.type}
        />
        <TeamRow
          team={teams.away}
          score={goals.away}
          hasMomentum={momentumData.teamId === teams.away.id}
          momentumType={momentumData.type}
        />
      </div>

      <div className="p-2 bg-gray-900/30 flex justify-between items-center">
        <Link
          href={slug}
          className="flex items-center gap-2 text-xs text-brand-muted hover:text-white transition-colors py-1 px-2"
        >
          <BarChart2 size={14} />
          <span>{t("match_details")}</span>
        </Link>
        {!isFinished && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-bold transition-all duration-300 rounded-lg px-2 py-1.5 bg-green-500/10"
            aria-label={isExpanded ? t("hide_panel") : t("vote_and_see_poll")}
          >
            <span>{t("vote_and_see_poll")}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      <div
        className={`transition-all duration-300 ease-in-out grid ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {isExpanded && <VotingPanel fixtureId={fixture.id} teams={teams} />}
        </div>
      </div>
    </div>
  );
}
