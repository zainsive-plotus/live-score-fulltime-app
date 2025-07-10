// src/components/match/MatchHeader.tsx
"use client";

import Image from "next/image";
import { format } from "date-fns";
import { useMemo } from "react";
import {
  Clock,
  CalendarDays,
  Shield,
  Zap,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { generateTeamSlug } from "@/lib/generate-team-slug";

// --- TYPE DEFINITIONS ---
interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}
interface Fixture {
  fixture: any;
  id: number;
  date: string;
  status: { long: string; short: any; elapsed: number | null };
  teams: { home: Team; away: Team };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  goals: { home: number | null; away: number | null };
  score: { fulltime: { home: number | null; away: number | null } };
}
interface MatchHeaderProps {
  fixture: Fixture;
  analytics: any;
}

// --- Compact StatPill Component (Unchanged) ---
const StatPill = ({
  icon: Icon,
  value,
  colorClass,
}: {
  icon: React.ElementType;
  value: string;
  colorClass: string;
}) => (
  <div
    className={`flex items-center gap-1.5 ${colorClass}/10 text-xs font-semibold ${colorClass} px-2 py-1 rounded-full`}
  >
    <Icon size={14} />
    <span>{value}</span>
  </div>
);

// --- ENHANCED Prediction Result Widget ---
const PredictionResultWidget = ({
  result,
  teams,
}: {
  result: any;
  teams: { home: Team; away: Team };
}) => {
  if (!result.predictedOutcome) {
    return (
      <div className="text-center text-xs text-text-muted py-4">
        Prediction data not available.
      </div>
    );
  }

  // --- State 1: Upcoming Match ---
  if (!result.isFinished) {
    const predictedTeam =
      result.predictedOutcome === "Home Win"
        ? teams.home
        : result.predictedOutcome === "Away Win"
        ? teams.away
        : null;
    return (
      <div className="w-full space-y-2 bg-[var(--brand-accent)]/5 p-3 rounded-lg text-center border border-[var(--brand-accent)]/20">
        <h4 className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Sparkles size={14} /> Fanskor Prediction
        </h4>
        <div className="flex items-center justify-center gap-2">
          {predictedTeam && (
            <Image
              src={proxyImageUrl(predictedTeam.logo)}
              alt={predictedTeam.name}
              width={24}
              height={24}
            />
          )}
          <p className="text-lg font-black text-white">
            {result.predictedOutcome}
          </p>
        </div>
        <p className="text-sm font-semibold text-text-muted">
          {result.confidence}% Confidence
        </p>
      </div>
    );
  }

  // --- State 2: Finished Match ---
  const wasCorrect = result.actualOutcome === result.predictedOutcome;
  const bgColor = wasCorrect ? "bg-green-500/10" : "bg-red-500/10";
  const textColor = wasCorrect ? "text-green-400" : "text-red-400";
  const Icon = wasCorrect ? CheckCircle : XCircle;

  return (
    <div className={`w-full space-y-2 ${bgColor} p-3 rounded-lg text-center`}>
      <h4
        className={`text-xs font-bold ${textColor} uppercase tracking-wider flex items-center justify-center gap-1.5`}
      >
        <Icon size={14} />{" "}
        {wasCorrect ? "Prediction Hit!" : "Prediction Missed"}
      </h4>
      {wasCorrect ? (
        <p className="text-lg font-black text-white">
          {result.predictedOutcome}
        </p>
      ) : (
        <div className="text-sm text-white">
          <p>
            Predicted:{" "}
            <span className="font-bold">{result.predictedOutcome}</span>
          </p>
          <p className={`${textColor}`}>
            Actual: <span className="font-bold">{result.actualOutcome}</span>
          </p>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export const MatchHeader: React.FC<MatchHeaderProps> = ({
  fixture,
  analytics,
}) => {
  const { teams, league, fixture: fixtureDetails, goals, score } = fixture;
  const isLive = useMemo(
    () =>
      ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
        fixtureDetails.status?.short || ""
      ),
    [fixtureDetails.status?.short]
  );
  const isFinished = useMemo(
    () => ["FT", "AET", "PEN"].includes(fixtureDetails.status.short),
    [fixtureDetails.status.short]
  );
  const finalScoreHome = score?.fulltime?.home ?? goals?.home;
  const finalScoreAway = score?.fulltime?.away ?? goals?.away;

  // --- All Data Calculation in a single useMemo for efficiency ---
  const { homeStrength, awayStrength, predictionResult } = useMemo(() => {
    const homeStats = analytics?.homeTeamStats;
    const awayStats = analytics?.awayTeamStats;

    // --- BUG FIX: Safely access nested properties ---
    const calcRating = (stats: any) => {
      const avgFor = stats?.goals?.for?.average?.total ?? "1.0";
      const avgAgainst = stats?.goals?.against?.average?.total ?? "1.0";
      return {
        attack: Math.min(10, (parseFloat(avgFor) / 2.0) * 10).toFixed(1),
        defense: Math.min(10, (1.5 / parseFloat(avgAgainst)) * 10).toFixed(1),
      };
    };

    const pred = analytics?.customPrediction;
    let result = {
      isFinished,
      predictedOutcome: null,
      confidence: 0,
      actualOutcome: null,
    };

    if (pred) {
      const maxConfidence = Math.max(pred.home, pred.draw, pred.away);
      let predictedOutcome: "Home Win" | "Draw" | "Away Win" = "Draw";
      if (maxConfidence === pred.home) predictedOutcome = "Home Win";
      if (maxConfidence === pred.away) predictedOutcome = "Away Win";
      // @ts-ignore
      result.predictedOutcome = predictedOutcome;
      result.confidence = maxConfidence;
    }

    if (isFinished) {
      // @ts-ignore
      result.actualOutcome = teams.home.winner
        ? "Home Win"
        : teams.away.winner
        ? "Away Win"
        : "Draw";
    }

    return {
      homeStrength: calcRating(homeStats),
      awayStrength: calcRating(awayStats),
      predictionResult: result,
    };
  }, [analytics, isFinished, teams]);

  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-lg mb-4">
      <div className="p-3 bg-[var(--color-primary)]/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm border-b border-gray-700/50">
        <Link
          href={generateLeagueSlug(league.name, league.id)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {league.logo && (
            <Image
              src={proxyImageUrl(league.logo)}
              alt={league.name}
              width={24}
              height={24}
            />
          )}
          <span className="font-bold text-white">{league.name}</span>
        </Link>
        <div className="flex items-center gap-4 text-text-muted">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            <span>{format(new Date(fixtureDetails.date), "dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{format(new Date(fixtureDetails.date), "HH:mm")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center p-4 md:p-6 gap-2 md:gap-4">
        {/* HOME TEAM */}
        <div className="flex flex-col items-center justify-start text-center gap-3">
          <Link href={generateTeamSlug(teams.home.name, teams.home.id)}>
            <Image
              src={proxyImageUrl(teams.home.logo)}
              alt={teams.home.name}
              width={80}
              height={80}
              className="w-16 h-16 md:w-20 md:h-20 object-contain hover:scale-110 transition-transform"
            />
          </Link>
          <h2 className="font-bold text-white text-lg md:text-xl truncate w-full">
            {teams.home.name}
          </h2>
          {homeStrength.attack && (
            <div className="flex items-center gap-2">
              <StatPill
                icon={Zap}
                value={homeStrength.attack}
                colorClass="text-green-400 bg-green-500"
              />
              <StatPill
                icon={Shield}
                value={homeStrength.defense}
                colorClass="text-blue-400 bg-blue-500"
              />
            </div>
          )}
        </div>

        {/* CENTER COLUMN: SCORE & PREDICTION */}
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <span className="text-4xl md:text-5xl font-black text-white">
            {finalScoreHome ?? "?"} - {finalScoreAway ?? "?"}
          </span>
          <span
            className={`text-xs md:text-sm font-semibold px-3 py-1 rounded-full ${
              isLive
                ? "bg-green-500/20 text-green-400 animate-pulse"
                : "bg-[var(--color-primary)] text-text-muted"
            }`}
          >
            {fixtureDetails.status.long}{" "}
            {isLive && `(${fixtureDetails.status.elapsed}')`}
          </span>
          <PredictionResultWidget result={predictionResult} teams={teams} />
        </div>

        {/* AWAY TEAM */}
        <div className="flex flex-col items-center justify-start text-center gap-3">
          <Link href={generateTeamSlug(teams.away.name, teams.away.id)}>
            <Image
              src={proxyImageUrl(teams.away.logo)}
              alt={teams.away.name}
              width={80}
              height={80}
              className="w-16 h-16 md:w-20 md:h-20 object-contain hover:scale-110 transition-transform"
            />
          </Link>
          <h2 className="font-bold text-white text-lg md:text-xl truncate w-full">
            {teams.away.name}
          </h2>
          {awayStrength.attack && (
            <div className="flex items-center gap-2">
              <StatPill
                icon={Zap}
                value={awayStrength.attack}
                colorClass="text-green-400 bg-green-500"
              />
              <StatPill
                icon={Shield}
                value={awayStrength.defense}
                colorClass="text-blue-400 bg-blue-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
