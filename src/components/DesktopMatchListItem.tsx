"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  History,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
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

interface DesktopMatchListItemProps {
  match: any;
  isLive: boolean;
}

export default function DesktopMatchListItem({
  match,
  isLive,
}: DesktopMatchListItemProps) {
  const { fixture, teams, goals } = match;
  const { t } = useTranslation();

  // Reverted: Slug does NOT contain the locale. StyledLink will handle it.
  const slug = generateMatchSlug(teams.home, teams.away, fixture.id);
  const isFinished = ["FT", "AET", "PEN"].includes(fixture.status.short);

  const [showResult, setShowResult] = useState(false);

  const { data: customOdds, isLoading } = useQuery({
    queryKey: ["customOdds", fixture.id],
    queryFn: () => fetchFanskorOdds(fixture.id),
    enabled: showResult,
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
      "bg-gradient-to-br from-[var(--brand-accent)] to-[#c54c14] text-white shadow-lg shadow-[var(--brand-accent)]/20";
    const defaultClasses =
      "bg-[var(--color-primary)] text-[var(--text-secondary)]";
    return (
      <div
        className={`flex flex-col items-center justify-center p-1 rounded-md w-16 h-12 transition-all duration-300 ${
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
        <span className="text-base font-black">{value || "-"}</span>
      </div>
    );
  };

  return (
    <div
      className="group flex items-center p-2 rounded-lg transition-all duration-300 ease-in-out border border-transparent hover:border-[var(--brand-accent)]/20 hover:bg-[var(--color-primary)]"
      style={{ backgroundColor: "var(--color-secondary)" }}
    >
      <Link href={slug} className="flex flex-1 items-center min-w-0">
        <div className="w-16 flex-shrink-0 text-center text-sm font-semibold">
          {isLive ? (
            <div className="flex items-center justify-center gap-1.5 text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              <span>{fixture.status.elapsed}'</span>
            </div>
          ) : isFinished ? (
            <div className="text-text-muted">{t("ft_short")}</div>
          ) : (
            <div className="text-text-primary">
              <ZonedDate date={fixture.date} format="HH:mm" />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1.5 pr-4">
          <div className="flex items-center gap-3">
            <Image
              src={proxyImageUrl(teams.home.logo)}
              alt={teams.home.name}
              width={20}
              height={20}
            />
            <span className="font-semibold text-base text-text-primary">
              {teams.home.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Image
              src={proxyImageUrl(teams.away.logo)}
              alt={teams.away.name}
              width={20}
              height={20}
            />
            <span className="font-semibold text-base text-text-primary">
              {teams.away.name}
            </span>
          </div>
        </div>
        <div
          className={`w-10 flex-shrink-0 flex flex-col items-center gap-1.5 text-base font-bold ${
            isLive ? "text-green-400" : "text-text-primary"
          }`}
        >
          <span>{goals.home ?? "-"}</span>
          <span>{goals.away ?? "-"}</span>
        </div>
      </Link>

      <div className="w-64 flex-shrink-0 flex items-center justify-end gap-4 pl-4 border-l border-gray-700/50">
        <div className="flex-1 text-center">
          {isFinished ? (
            !showResult ? (
              <button
                onClick={() => setShowResult(true)}
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold bg-[var(--color-primary)] border border-[var(--text-muted)]/20 text-text-muted hover:bg-[var(--text-muted)] hover:text-black rounded-md p-2.5 transition-all duration-200"
              >
                <History size={16} /> {t("see_prediction_result")}
              </button>
            ) : isLoading ? (
              <div className="flex justify-center items-center gap-2 text-sm font-semibold text-text-muted p-2.5">
                <Loader2 size={16} className="animate-spin" />{" "}
                {t("loading_result")}
              </div>
            ) : customOdds ? (
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
              <span className="text-xs text-text-muted font-semibold">
                {t("prediction_data_unavailable")}
              </span>
            )
          ) : !showResult ? (
            <button
              onClick={() => setShowResult(true)}
              className="flex items-center justify-center gap-2 w-full text-sm font-semibold bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/50 text-[var(--brand-accent)] hover:bg-[var(--brand-accent)] hover:text-white rounded-md p-2.5 transition-all duration-200"
            >
              <TrendingUp size={16} />
              {t("show_odds")}
            </button>
          ) : isLoading ? (
            <div className="flex justify-center items-center gap-2 text-sm font-semibold text-text-muted p-2.5">
              <Loader2 size={16} className="animate-spin" />{" "}
              {t("calculating_odds")}
            </div>
          ) : customOdds ? (
            <div className="flex items-center justify-around gap-1">
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
          ) : (
            <span className="text-xs text-text-muted font-semibold">
              {t("odds_unavailable")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
// Skeleton component is unchanged.
export const MatchListItemSkeleton = () => (
  <div
    className="flex items-center p-2 rounded-lg animate-pulse"
    style={{ backgroundColor: "var(--color-secondary)" }}
  >
    <div className="flex-1 flex items-center">
      <div className="w-16 flex-shrink-0">
        <div className="h-5 w-10 mx-auto rounded bg-[var(--color-primary)]"></div>
      </div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3 w-4/5">
          <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]"></div>
          <div className="h-5 w-full rounded bg-[var(--color-primary)]"></div>
        </div>
        <div className="flex items-center gap-3 w-4/5">
          <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]"></div>
          <div className="h-5 w-full rounded bg-[var(--color-primary)]"></div>
        </div>
      </div>
      <div className="w-10 flex-shrink-0 flex flex-col items-center gap-3">
        <div className="h-5 w-4 bg-[var(--color-primary)] rounded"></div>
        <div className="h-5 w-4 bg-[var(--color-primary)] rounded"></div>
      </div>
    </div>
    <div className="w-64 flex-shrink-0 pl-4 border-l border-gray-700/50 flex items-center justify-end gap-4">
      <div className="w-full h-11 rounded-md bg-[var(--color-primary)]"></div>
      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]"></div>
    </div>
  </div>
);
