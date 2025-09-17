// ===== src/components/player/PlayerTrophiesWidget.tsx =====
"use client";

import { Trophy, Info, Medal } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useMemo } from "react";

// A new, dedicated component for a single trophy card
const TrophyCard = ({
  name,
  seasons,
  place,
}: {
  name: string;
  seasons: string[];
  place: string;
}) => {
  const isWinner = place === "Winner";
  const colorClasses = isWinner
    ? {
        bg: "bg-amber-500/10",
        border: "border-amber-500/50",
        iconText: "text-amber-400",
        text: "text-white",
      }
    : {
        bg: "bg-gray-500/10",
        border: "border-gray-500/50",
        iconText: "text-gray-400",
        text: "text-text-secondary",
      };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${colorClasses.border} ${colorClasses.bg}`}
    >
      <div className="flex-shrink-0">
        {isWinner ? (
          <Trophy size={32} className={colorClasses.iconText} />
        ) : (
          <Medal size={32} className={colorClasses.iconText} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base ${colorClasses.text}`}>{name}</p>
        <p
          className="text-xs text-brand-muted truncate"
          title={seasons.join(", ")}
        >
          <span className="font-semibold">{seasons.length}x</span>{" "}
          {isWinner ? "Winner" : "Runner-up"} ({seasons.join(", ")})
        </p>
      </div>
    </div>
  );
};

export default function PlayerTrophiesWidget({
  trophies,
}: {
  trophies: any[];
}) {
  const { t } = useTranslation();

  // --- NEW LOGIC: Group trophies by league name ---
  const groupedTrophies = useMemo(() => {
    if (!trophies || trophies.length === 0) return [];

    const groups: {
      [key: string]: { name: string; seasons: string[]; place: string };
    } = {};

    // First, group all seasons by league and place
    trophies.forEach((trophy) => {
      const key = `${trophy.league}-${trophy.place}`;
      if (!groups[key]) {
        groups[key] = {
          name: trophy.league,
          seasons: [],
          place: trophy.place,
        };
      }
      groups[key].seasons.push(trophy.season);
    });

    // Sort the seasons within each group chronologically descending
    Object.values(groups).forEach((group) => {
      group.seasons.sort(
        (a, b) => parseInt(b.split("-")[0]) - parseInt(a.split("-")[0])
      );
    });

    // Finally, sort the groups: Winners first, then by the most recent season
    return Object.values(groups).sort((a, b) => {
      if (a.place === "Winner" && b.place !== "Winner") return -1;
      if (a.place !== "Winner" && b.place === "Winner") return 1;
      const latestSeasonA = parseInt(a.seasons[0].split("-")[0]);
      const latestSeasonB = parseInt(b.seasons[0].split("-")[0]);
      return latestSeasonB - latestSeasonA;
    });
  }, [trophies]);

  if (!groupedTrophies || groupedTrophies.length === 0) {
    return (
      <div className="p-8 text-center text-brand-muted bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("no_honours_found")}</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary rounded-xl p-4 md:p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy size={22} /> {t("honours")}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groupedTrophies.map((group) => (
          <TrophyCard
            key={`${group.name}-${group.place}`}
            name={group.name}
            seasons={group.seasons}
            place={group.place}
          />
        ))}
      </div>
    </div>
  );
}
