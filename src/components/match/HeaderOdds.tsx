// ===== src/components/match/HeaderOdds.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useMemo } from "react";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation";

interface HeaderOddsProps {
  fixtureId: number;
  teams: { home: any; away: any };
}

const fetchOdds = async (fixtureId: number) => {
  const { data } = await axios.get(`/api/odds?fixture=${fixtureId}`);
  return data;
};

const calculateProbabilities = (
  odds: { home?: string; draw?: string; away?: string } | null
) => {
  if (!odds || !odds.home || !odds.draw || !odds.away) {
    return {
      probabilities: { home: 33, draw: 34, away: 33 },
      favoriteOutcome: "draw",
    };
  }

  const pHome = 1 / parseFloat(odds.home);
  const pDraw = 1 / parseFloat(odds.draw);
  const pAway = 1 / parseFloat(odds.away);
  const totalP = pHome + pDraw + pAway;

  const probabilities = {
    home: Math.round((pHome / totalP) * 100),
    draw: Math.round((pDraw / totalP) * 100),
    away: Math.round((pAway / totalP) * 100),
  };

  const totalRounded =
    probabilities.home + probabilities.draw + probabilities.away;
  if (totalRounded !== 100) {
    probabilities.draw += 100 - totalRounded;
  }

  const favoriteOutcome =
    odds.home <= odds.draw && odds.home <= odds.away
      ? "home"
      : odds.away <= odds.home && odds.away <= odds.draw
      ? "away"
      : "draw";

  return { probabilities, favoriteOutcome };
};

export default function HeaderOdds({ fixtureId, teams }: HeaderOddsProps) {
  const { t } = useTranslation();

  const { data: odds, isLoading } = useQuery({
    queryKey: ["headerOdds", fixtureId],
    queryFn: () => fetchOdds(fixtureId),
    staleTime: 1000 * 60 * 60,
    enabled: !!fixtureId,
  });

  const { probabilities, favoriteOutcome } = useMemo(
    () => calculateProbabilities(odds),
    [odds]
  );

  if (isLoading) {
    return (
      <div className="mt-4 animate-pulse">
        <div className="flex h-16 w-full rounded-lg bg-gray-700/50"></div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-gray-700/50"></div>
      </div>
    );
  }

  if (!odds) return null;

  const OddSegment = ({
    label,
    team,
    odd,
    probability,
    isFavorite,
  }: {
    label: string;
    team?: any;
    odd?: string;
    probability: number;
    isFavorite: boolean;
  }) => (
    <button
      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md transition-colors duration-200
        ${
          isFavorite
            ? "bg-brand-purple/20"
            : "bg-gray-800/50 hover:bg-gray-700/50"
        }`}
    >
      {team?.logo && (
        <Image
          src={proxyImageUrl(team.logo)}
          alt={team.name}
          width={24}
          height={24}
        />
      )}
      <span
        className={`text-sm font-bold ${
          isFavorite ? "text-brand-purple" : "text-text-muted"
        }`}
      >
        {team ? team.name.split(" ").slice(-1)[0] : label}
      </span>
      <span className="text-base font-black text-white">{odd || "-"}</span>
    </button>
  );

  return (
    <div className="mt-4 w-full max-w-xs mx-auto">
      <div className="flex items-stretch justify-center gap-1">
        <OddSegment
          label={t("home_short")}
          team={teams.home}
          odd={odds.home}
          probability={probabilities.home}
          isFavorite={favoriteOutcome === "home"}
        />
        <OddSegment
          label={t("draw")}
          odd={odds.draw}
          probability={probabilities.draw}
          isFavorite={favoriteOutcome === "draw"}
        />
        <OddSegment
          label={t("away_short")}
          team={teams.away}
          odd={odds.away}
          probability={probabilities.away}
          isFavorite={favoriteOutcome === "away"}
        />
      </div>
      <div className="mt-1.5 flex w-full h-1.5 rounded-full overflow-hidden bg-brand-dark">
        <div
          className="bg-brand-purple h-full"
          style={{ width: `${probabilities.home}%` }}
        ></div>
        <div
          className="bg-gray-500 h-full"
          style={{ width: `${probabilities.draw}%` }}
        ></div>
        <div
          className="bg-blue-500 h-full"
          style={{ width: `${probabilities.away}%` }}
        ></div>
      </div>
    </div>
  );
}
