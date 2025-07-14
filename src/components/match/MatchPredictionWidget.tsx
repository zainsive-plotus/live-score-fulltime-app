"use client";

import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface PredictionData {
  home: number;
  draw: number;
  away: number;
}

interface MatchPredictionWidgetProps {
  apiPrediction: any;
  customPrediction: PredictionData | null;
  bookmakerOdds: any[];
  teams: { home: any; away: any };
}

const MAJOR_BOOKMAKER_IDS = new Set([1, 2, 6, 8, 9, 24, 31]);

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

export default function MatchPredictionWidget({
  apiPrediction,
  customPrediction,
  bookmakerOdds,
  teams,
}: MatchPredictionWidgetProps) {
  const { t } = useTranslation(); // <-- Use hook

  const majorBookmakers = useMemo(() => {
    if (!bookmakerOdds) return [];
    return bookmakerOdds.filter((bookie) => MAJOR_BOOKMAKER_IDS.has(bookie.id));
  }, [bookmakerOdds]);

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

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-white">
          {t("prediction_comparison")}
        </h3>
      </div>

      {majorBookmakers && majorBookmakers.length > 0 && bestOdds && (
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
      )}
    </div>
  );
}
