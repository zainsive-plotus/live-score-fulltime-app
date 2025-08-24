// ===== src/components/MobileMatchListItem.tsx =====

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Loader2,
  BarChart2,
  TrendingUp,
  History,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation";
import ZonedDate from "./ZonedDate";

type Odds = { home: string; draw: string; away: string } | undefined | null;
const fetchFanskorOdds = async (fixtureId: number): Promise<Odds | null> => {
  try {
    const { data } = await axios.post("/api/batch-predictions", {
      fixtureIds: [fixtureId],
    });
    return data[fixtureId] || null;
  } catch (error) {
    console.error(
      `Failed to fetch Fanskor odds for fixture ${fixtureId}`,
      error
    );
    return null;
  }
};

const TeamRow = ({
  team,
  score,
  isLive,
}: {
  team: { name: string; logo: string; winner: boolean };
  score: number | null;
  isLive: boolean;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3 min-w-0">
      <Image
        src={proxyImageUrl(team.logo)}
        alt={team.name}
        width={24}
        height={24}
        unoptimized={true}
      />
      <span
        className={`font-semibold text-sm truncate ${
          team.winner ? "text-text-primary" : "text-text-secondary"
        }`}
      >
        {team.name}
      </span>
    </div>
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
  </div>
);

export default function MobileMatchListItem({ match }: { match: any }) {
  const { fixture, teams, goals } = match;
  const { t } = useTranslation();
  const slug = generateMatchSlug(teams.home, teams.away, fixture.id);
  const [isExpanded, setIsExpanded] = useState(false);

  const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(
    fixture.status.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(fixture.status.short);

  const { data: customOdds, isLoading } = useQuery({
    queryKey: ["customOdds", fixture.id],
    queryFn: () => fetchFanskorOdds(fixture.id),
    enabled: isExpanded,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { predictedOutcome, lowestOddValue } = useMemo(() => {
    if (!customOdds) return { predictedOutcome: null, lowestOddValue: null };
    const odds = {
      home: parseFloat(customOdds.home || "999"),
      draw: parseFloat(customOdds.draw || "999"),
      away: parseFloat(customOdds.away || "999"),
    };
    const minOdd = Math.min(odds.home, odds.draw, odds.away);
    if (minOdd === odds.home)
      return { predictedOutcome: "Home", lowestOddValue: customOdds.home };
    if (minOdd === odds.away)
      return { predictedOutcome: "Away", lowestOddValue: customOdds.away };
    return { predictedOutcome: "Draw", lowestOddValue: customOdds.draw };
  }, [customOdds]);

  const actualResult = useMemo(() => {
    if (!isFinished) return null;
    if (teams.home.winner) return "Home";
    if (teams.away.winner) return "Away";
    return "Draw";
  }, [isFinished, teams]);

  const wasPredictionCorrect = predictedOutcome === actualResult;

  const CustomOddBox = ({
    value,
    label,
    isFavorite,
  }: {
    value: string | undefined;
    label: string;
    isFavorite: boolean;
  }) => {
    const favoriteClasses =
      "bg-gradient-to-br from-[var(--brand-accent)] to-[#c54c14] text-white";
    const defaultClasses =
      "bg-[var(--color-primary)] text-[var(--text-secondary)]";
    return (
      <div
        className={`flex flex-col flex-1 items-center justify-center p-2 rounded-md transition-all duration-300 ${
          isFavorite ? favoriteClasses : defaultClasses
        }`}
      >
        <span
          className={`text-xs font-semibold ${
            isFavorite ? "opacity-80" : "text-[var(--text-muted)]"
          }`}
        >
          {label}
        </span>
        <span className="text-sm font-black">{value || "-"}</span>
      </div>
    );
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: "var(--color-secondary)" }}
    >
      <Link href={slug}>
        <div className="flex items-center gap-2 p-3">
          <div className="w-12 flex-shrink-0 text-center text-xs font-bold">
            {isLive ? (
              <div className="flex flex-col items-center justify-center gap-1 text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                <span>{fixture.status.elapsed}'</span>
              </div>
            ) : isFinished ? (
              <div className="text-text-muted">{t("ft_short")}</div>
            ) : (
              <ZonedDate date={fixture.date} format="HH:mm" />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <TeamRow team={teams.home} score={goals.home} isLive={isLive} />
            <TeamRow team={teams.away} score={goals.away} isLive={isLive} />
          </div>
        </div>
      </Link>

      {isExpanded && (
        <div className="mx-3 mb-3 pt-3 border-t border-[var(--color-primary)]">
          {isLoading ? (
            <div className="flex justify-center items-center gap-2 text-sm font-semibold text-text-muted p-2.5">
              <Loader2 size={16} className="animate-spin" /> {t("loading")}...
            </div>
          ) : customOdds ? (
            isFinished ? (
              <div
                className={`flex items-center justify-center gap-2 p-2.5 rounded-md text-sm font-bold ${
                  wasPredictionCorrect
                    ? "bg-green-500/10 text-green-400"
                    : "bg-gray-700/50 text-text-muted"
                }`}
              >
                {wasPredictionCorrect ? (
                  <CheckCircle size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                <span>
                  {t("predicted_result", {
                    outcome: predictedOutcome,
                    odds: lowestOddValue,
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-around gap-2">
                <CustomOddBox
                  value={customOdds.home}
                  label={t("odd_label_home")}
                  isFavorite={predictedOutcome === "Home"}
                />
                <CustomOddBox
                  value={customOdds.draw}
                  label={t("odd_label_draw")}
                  isFavorite={predictedOutcome === "Draw"}
                />
                <CustomOddBox
                  value={customOdds.away}
                  label={t("odd_label_away")}
                  isFavorite={predictedOutcome === "Away"}
                />
              </div>
            )
          ) : (
            <p className="text-xs text-center text-text-muted p-2">
              {t("prediction_data_unavailable")}
            </p>
          )}
        </div>
      )}

      <div
        className="flex items-center justify-between p-2"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Link
          href={slug}
          className="flex items-center gap-1.5 text-xs text-text-muted font-semibold hover:text-white transition-colors px-2 py-1"
        >
          <BarChart2 size={14} />
          <span>{t("match_details")}</span>
        </Link>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] hover:bg-[var(--brand-accent)] hover:text-white rounded-full px-3 py-1.5 transition-all duration-200"
        >
          {isFinished ? <History size={14} /> : <TrendingUp size={14} />}
          <span>
            {isExpanded
              ? isFinished
                ? t("hide_result")
                : t("hide_odds")
              : isFinished
              ? t("see_result")
              : t("show_odds")}
          </span>
        </button>
      </div>
    </div>
  );
}

// Skeleton remains the same
export const MobileMatchListItemSkeleton = () => (
  <div
    className="flex flex-col p-3 rounded-lg animate-pulse"
    style={{ backgroundColor: "var(--color-secondary)" }}
  >
    <div className="flex items-center gap-3">
      <div className="w-12 h-8 rounded bg-[var(--color-primary)]"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-4/5 rounded bg-[var(--color-primary)]"></div>
        <div className="h-4 w-3/5 rounded bg-[var(--color-primary)]"></div>
      </div>
    </div>
    <div className="h-8 mt-3 rounded-md bg-[var(--color-primary)]"></div>
  </div>
);
