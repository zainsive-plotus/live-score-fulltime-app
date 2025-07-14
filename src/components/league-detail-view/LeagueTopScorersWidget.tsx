"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { Trophy, Info } from "lucide-react";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

const fetchTopScorers = async (leagueId: number, season: number) => {
  const { data } = await axios.get(
    `/api/top-scorers?league=${leagueId}&season=${season}`
  );
  return data;
};

const PlayerRow = ({ player, rank }: { player: any; rank: number }) => {
  const isTop = rank === 1;
  const bgColor = isTop ? "bg-[var(--brand-accent)]/10" : "bg-transparent";
  const borderColor = isTop
    ? "border-l-[var(--brand-accent)]"
    : "border-l-transparent";

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors border-l-4 ${bgColor} ${borderColor}`}
    >
      <span
        className={`w-6 text-center font-bold text-lg ${
          isTop ? "text-[var(--brand-accent)]" : "text-text-muted"
        }`}
      >
        {rank}
      </span>
      <Image
        src={proxyImageUrl(player.player.photo)}
        alt={player.player.name}
        width={36}
        height={36}
        className="rounded-full bg-gray-800"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate text-sm">
          {player.player.name}
        </p>
        <p className="text-xs text-text-muted truncate">
          {player.statistics[0].team.name}
        </p>
      </div>
      <div
        className={`flex items-center justify-center gap-2 font-bold text-lg p-2 rounded-lg ${
          isTop ? "text-yellow-300" : "text-white"
        }`}
      >
        <Trophy size={16} />
        <span>{player.statistics[0].goals.total}</span>
      </div>
    </div>
  );
};

export default function LeagueTopScorersWidget({
  leagueId,
  season,
}: {
  leagueId: number;
  season: number;
}) {
  const { t } = useTranslation(); // <-- Use hook
  const { data: topScorers, isLoading } = useQuery({
    queryKey: ["topScorers", leagueId, season],
    queryFn: () => fetchTopScorers(leagueId, season),
    staleTime: 1000 * 60 * 60,
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 p-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-6 h-6 rounded bg-gray-700"></div>
              <div className="w-9 h-9 rounded-full bg-gray-700"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-700 rounded"></div>
              </div>
              <div className="w-12 h-8 rounded bg-gray-700"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!topScorers || topScorers.length === 0) {
      return (
        <div className="text-center h-full flex flex-col justify-center items-center p-4">
          <Info size={28} className="mx-auto text-text-muted mb-2" />
          <p className="text-text-light font-semibold text-sm">
            {t("top_scorers_not_available")}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1 p-2">
        {topScorers.slice(0, 5).map((scorer: any, index: number) => (
          <PlayerRow key={scorer.player.id} player={scorer} rank={index + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-brand-secondary rounded-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white">
          {t("golden_boot_race")}
        </h3>
      </div>
      <div className="flex-grow">{renderContent()}</div>
    </div>
  );
}
