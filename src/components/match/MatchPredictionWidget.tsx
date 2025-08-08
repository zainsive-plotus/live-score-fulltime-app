// ===== src/components/match/MatchPredictionWidget.tsx =====

"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Sparkles, Users, Info } from "lucide-react";
import { proxyImageUrl } from "@/lib/image-proxy";

interface PredictionData {
  home: number;
  draw: number;
  away: number;
}

interface FullPredictionData {
  customPrediction: PredictionData | null;
  bookmakerOdds: any[];
  teams: { home: any; away: any };
}

interface MatchPredictionWidgetProps {
  fixtureId: string;
}

const fetchPredictionData = async (
  fixtureId: string
): Promise<FullPredictionData | null> => {
  try {
    const { data } = await axios.get(
      `/api/match-prediction?fixtureId=${fixtureId}`
    );
    return data;
  } catch (error) {
    console.error(
      `[MatchPredictionWidget] Failed to fetch prediction data for fixture ${fixtureId}:`,
      error
    );
    return null;
  }
};

const MAJOR_BOOKMAKER_IDS = new Set([1, 2, 6, 8, 9, 24, 31]);

const PredictionCard = ({
  label,
  team,
  percentage,
  isHighest,
}: {
  label: string;
  team?: { name: string; logo: string };
  percentage: number;
  isHighest: boolean;
}) => {
  const containerClasses = isHighest
    ? "bg-brand-purple/10 border-brand-purple shadow-lg shadow-brand-purple/20"
    : "bg-gray-800/30 border-gray-700/50";
  const textClasses = isHighest ? "text-brand-purple" : "text-brand-muted";

  return (
    <div
      className={`flex flex-col items-center justify-between p-3 rounded-lg border text-center transition-all duration-300 h-36 ${containerClasses}`}
    >
      <div className="flex flex-col items-center gap-1">
        {team?.logo && (
          <Image
            src={proxyImageUrl(team.logo)}
            alt={team.name}
            width={32}
            height={32}
            className="mb-1"
          />
        )}
        <span
          className={`text-xs font-bold uppercase tracking-wider ${textClasses}`}
        >
          {label}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black text-white">{percentage}%</span>
        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full ${
              isHighest ? "bg-brand-purple" : "bg-gray-500"
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const BookmakerOddsRow = ({
  bookmaker,
  bestOdds,
}: {
  bookmaker: any;
  bestOdds: any;
}) => {
  const matchWinnerBet = bookmaker.bets.find((bet: any) => bet.id === 1);
  if (!matchWinnerBet) return null;

  const odds = {
    home:
      matchWinnerBet.values.find((v: any) => v.value === "Home")?.odd || "-",
    draw:
      matchWinnerBet.values.find((v: any) => v.value === "Draw")?.odd || "-",
    away:
      matchWinnerBet.values.find((v: any) => v.value === "Away")?.odd || "-",
  };

  const highlightClass =
    "bg-yellow-500/20 text-brand-yellow ring-1 ring-yellow-500/50";
  const defaultClass = "bg-gray-700/50";

  return (
    <div className="grid grid-cols-4 gap-2 items-center text-sm py-2 border-b border-gray-700/50 last:border-b-0">
      <span className="col-span-1 font-semibold text-brand-light truncate pr-2">
        {bookmaker.name}
      </span>
      <span
        className={`col-span-1 text-center font-mono rounded p-1.5 transition-colors ${
          odds.home === bestOdds.home ? highlightClass : defaultClass
        }`}
      >
        {odds.home}
      </span>
      <span
        className={`col-span-1 text-center font-mono rounded p-1.5 transition-colors ${
          odds.draw === bestOdds.draw ? highlightClass : defaultClass
        }`}
      >
        {odds.draw}
      </span>
      <span
        className={`col-span-1 text-center font-mono rounded p-1.5 transition-colors ${
          odds.away === bestOdds.away ? highlightClass : defaultClass
        }`}
      >
        {odds.away}
      </span>
    </div>
  );
};

export const PredictionWidgetSkeleton = () => (
  <div className="bg-brand-secondary p-4 rounded-lg animate-pulse">
    <div className="h-6 w-3/4 bg-gray-700 rounded mb-4"></div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="h-32 bg-gray-700/50 rounded-lg"></div>
      <div className="h-32 bg-gray-700/50 rounded-lg"></div>
      <div className="h-32 bg-gray-700/50 rounded-lg"></div>
    </div>
    <div className="space-y-3 pt-4 border-t border-gray-700/50">
      <div className="h-8 w-full bg-gray-700/50 rounded-md"></div>
      <div className="h-8 w-full bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);

export default function MatchPredictionWidget({
  fixtureId,
}: MatchPredictionWidgetProps) {
  const { t } = useTranslation();

  const {
    data: predictionData,
    isLoading,
    isError,
  } = useQuery<FullPredictionData | null>({
    queryKey: ["predictionData", fixtureId],
    queryFn: () => fetchPredictionData(fixtureId),
    staleTime: 1000 * 60 * 5,
    enabled: !!fixtureId,
  });

  const majorBookmakers = useMemo(() => {
    if (!predictionData?.bookmakerOdds) return [];
    return predictionData.bookmakerOdds.filter((bookie) =>
      MAJOR_BOOKMAKER_IDS.has(bookie.id)
    );
  }, [predictionData?.bookmakerOdds]);

  const { bestOdds } = useMemo(() => {
    if (!majorBookmakers || majorBookmakers.length === 0) {
      return { bestOdds: null };
    }
    let maxHome = 0,
      maxDraw = 0,
      maxAway = 0;
    majorBookmakers.forEach((bookie) => {
      const bet = bookie.bets.find((b: any) => b.id === 1);
      if (bet) {
        const homeOdd = parseFloat(
          bet.values.find((v: any) => v.value === "Home")?.odd || "0"
        );
        const drawOdd = parseFloat(
          bet.values.find((v: any) => v.value === "Draw")?.odd || "0"
        );
        const awayOdd = parseFloat(
          bet.values.find((v: any) => v.value === "Away")?.odd || "0"
        );
        if (homeOdd > maxHome) maxHome = homeOdd;
        if (drawOdd > maxDraw) maxDraw = drawOdd;
        if (awayOdd > maxAway) maxAway = awayOdd;
      }
    });
    return {
      bestOdds: {
        home: maxHome.toFixed(2),
        draw: maxDraw.toFixed(2),
        away: maxAway.toFixed(2),
      },
    };
  }, [majorBookmakers]);

  const highestPrediction = useMemo(() => {
    if (!predictionData?.customPrediction) return null;
    return Math.max(
      predictionData.customPrediction.home,
      predictionData.customPrediction.draw,
      predictionData.customPrediction.away
    );
  }, [predictionData?.customPrediction]);

  if (isLoading) {
    return <PredictionWidgetSkeleton />;
  }

  if (isError || !predictionData) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">
          {t("prediction_comparison")}
        </h3>
        <p className="text-sm text-center text-brand-muted py-4">
          {t("prediction_data_unavailable")}
        </p>
      </div>
    );
  }

  const { customPrediction, teams } = predictionData;
  const noPrediction = !customPrediction;
  const noOdds = majorBookmakers.length === 0 || !bestOdds;

  if (noPrediction && noOdds) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">
          {t("prediction_comparison")}
        </h3>
        <p className="text-sm text-center text-brand-muted py-4">
          {t("prediction_data_unavailable")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-[var(--brand-accent)]" />
        <h3 className="text-lg font-bold text-white">
          {t("prediction_comparison")}
        </h3>
      </div>

      {customPrediction ? (
        <div className="mb-4">
          <h4 className="font-semibold text-brand-light mb-2">
            {t("fanskor_prediction_engine")}
          </h4>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <PredictionCard
              label={t("home_win")}
              team={teams.home}
              percentage={customPrediction.home}
              isHighest={customPrediction.home === highestPrediction}
            />
            <PredictionCard
              label={t("draw")}
              percentage={customPrediction.draw}
              isHighest={customPrediction.draw === highestPrediction}
            />
            <PredictionCard
              label={t("away_win")}
              team={teams.away}
              percentage={customPrediction.away}
              isHighest={customPrediction.away === highestPrediction}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-brand-muted text-sm my-4 bg-gray-800/30 rounded-lg">
          <Info size={20} className="mx-auto mb-2" />
          <p>{t("prediction_engine_unavailable")}</p>
        </div>
      )}

      {majorBookmakers.length > 0 && bestOdds ? (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <h4 className="font-semibold text-brand-light mb-2">
            {t("compare_bookmakers", { count: majorBookmakers.length })}
          </h4>
          <div className="grid grid-cols-4 gap-2 text-xs text-brand-muted font-bold mb-1">
            <span className="col-span-1">{t("bookmaker")}</span>
            <span className="col-span-1 text-center">
              {t("odd_label_home")}
            </span>
            <span className="col-span-1 text-center">
              {t("odd_label_draw")}
            </span>
            <span className="col-span-1 text-center">
              {t("odd_label_away")}
            </span>
          </div>
          <div className="space-y-1">
            {majorBookmakers.map((bookie) => (
              <BookmakerOddsRow
                key={bookie.id}
                bookmaker={bookie}
                bestOdds={bestOdds}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-brand-muted text-sm mt-4 border-t border-gray-700/50">
          <p>{t("bookmaker_odds_unavailable")}</p>
        </div>
      )}
    </div>
  );
}
