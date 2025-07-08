// src/components/match/MatchPredictionWidget.tsx
"use client";

import { useMemo } from "react";
import { BrainCircuit } from "lucide-react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";

// --- Type Definitions ---
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

// --- CONFIGURATION: Whitelist of Major Bookmaker IDs ---
const MAJOR_BOOKMAKER_IDS = new Set([1, 2, 6, 8, 9, 24, 31]);

// --- NEW: Sub-component for a single outcome comparison (e.g., Home Win) ---
const OutcomeComparison = ({
  icon,
  label,
  apiValue,
  customValue,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  apiValue?: number;
  customValue?: number;
  colorClass: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      {icon}
      <h5 className="font-bold text-white">{label}</h5>
    </div>
    <div className="space-y-1.5 text-xs">
      {/* API Bar */}
      <div className="flex items-center gap-2">
        <span className="w-12 text-brand-muted font-semibold">Others</span>
        <div className="flex-1 bg-gray-700 h-5 rounded-sm overflow-hidden">
          <div
            className={`h-full ${colorClass} opacity-70 transition-all duration-500`}
            style={{ width: `${apiValue || 0}%` }}
          ></div>
        </div>
        <span className="w-8 font-mono text-right text-brand-muted">
          {apiValue ?? "-"}%
        </span>
      </div>
      {/* Fanskor Bar */}
      <div className="flex items-center gap-2">
        <span className="w-12 text-white font-bold">Fanskor</span>
        <div className="flex-1 bg-gray-700 h-5 rounded-sm overflow-hidden">
          <div
            className={`h-full ${colorClass} transition-all duration-500`}
            style={{ width: `${customValue || 0}%` }}
          ></div>
        </div>
        <span className="w-8 font-mono font-bold text-right text-white">
          {customValue ?? "-"}%
        </span>
      </div>
    </div>
  </div>
);

// --- BookmakerOddsRow sub-component (unchanged) ---
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
  const majorBookmakers = useMemo(() => {
    if (!bookmakerOdds) return [];
    return bookmakerOdds.filter((bookie) => MAJOR_BOOKMAKER_IDS.has(bookie.id));
  }, [bookmakerOdds]);

  const { averageOdds, bestOdds } = useMemo(() => {
    if (!majorBookmakers || majorBookmakers.length === 0) {
      return { averageOdds: null, bestOdds: null };
    }

    let totalHome = 0,
      totalDraw = 0,
      totalAway = 0;
    let maxHome = 0,
      maxDraw = 0,
      maxAway = 0;
    let count = 0;

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

        if (homeOdd > 0 && drawOdd > 0 && awayOdd > 0) {
          totalHome += homeOdd;
          totalDraw += drawOdd;
          totalAway += awayOdd;
          if (homeOdd > maxHome) maxHome = homeOdd;
          if (drawOdd > maxDraw) maxDraw = drawOdd;
          if (awayOdd > maxAway) maxAway = awayOdd;
          count++;
        }
      }
    });

    if (count === 0) return { averageOdds: null, bestOdds: null };

    return {
      averageOdds: {
        home: (totalHome / count).toFixed(2),
        draw: (totalDraw / count).toFixed(2),
        away: (totalAway / count).toFixed(2),
      },
      bestOdds: {
        home: maxHome.toFixed(2),
        draw: maxDraw.toFixed(2),
        away: maxAway.toFixed(2),
      },
    };
  }, [majorBookmakers]);

  const parsedApiPrediction: PredictionData | null = apiPrediction?.predictions
    ?.percent
    ? {
        home: parseInt(apiPrediction.predictions.percent.home.replace("%", "")),
        draw: parseInt(apiPrediction.predictions.percent.draw.replace("%", "")),
        away: parseInt(apiPrediction.predictions.percent.away.replace("%", "")),
      }
    : null;

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-white">Prediction Comparison</h3>
      </div>

      {/* Average Market Odds & Bookmaker Comparison Sections */}
      {averageOdds && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <h4 className="font-semibold text-brand-light text-sm mb-2">
            Average Market Odds
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-white font-bold">
            <div className="bg-green-500/20 p-2 rounded-md">
              1: {averageOdds.home}
            </div>
            <div className="bg-yellow-500/20 p-2 rounded-md">
              X: {averageOdds.draw}
            </div>
            <div className="bg-red-500/20 p-2 rounded-md">
              2: {averageOdds.away}
            </div>
          </div>
        </div>
      )}

      {majorBookmakers && majorBookmakers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <h4 className="font-semibold text-brand-light mb-2">
            Compare Major Bookmakers ({majorBookmakers.length})
          </h4>

          <div className="grid grid-cols-4 gap-2 text-xs text-brand-muted font-bold mb-1">
            <span className="col-span-1">Bookmaker</span>
            <span className="col-span-1 text-center">Home (1)</span>
            <span className="col-span-1 text-center">Draw (X)</span>
            <span className="col-span-1 text-center">Away (2)</span>
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
