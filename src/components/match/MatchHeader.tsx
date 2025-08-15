// ===== src/components/match/MatchHeader.tsx =====

"use client";

import Image from "next/image";
import { format } from "date-fns";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Clock,
  CalendarDays,
  Sparkles,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { useTranslation } from "@/hooks/useTranslation";

// --- TYPE DEFINITIONS ---
interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}
interface Fixture {
  fixture: any;
  teams: { home: Team; away: Team };
  league: any;
  goals: { home: number | null; away: number | null };
  score: { fulltime: { home: number | null; away: number | null } };
}
interface MatchHeaderProps {
  fixture: Fixture;
}
type Odds = { home?: string; draw?: string; away?: string } | null;
type PredictionOdds = { home: number; draw: number; away: number } | null;

// --- API FETCHERS ---
const fetchHeaderEnrichmentData = async (fixtureId: string, locale: string) => {
  if (!fixtureId || !locale) return null;
  const { data } = await axios.get(
    `/api/match-prediction?fixtureId=${fixtureId}`
  );
  return data;
};

const fetchHeaderOdds = async (fixtureId: number): Promise<Odds> => {
  const { data } = await axios.get(`/api/odds?fixture=${fixtureId}`);
  return data;
};

// --- SUB-COMPONENTS ---
const PredictionResultWidget = ({
  result,
  teams,
  isLoading,
  t,
}: {
  result: any;
  teams: { home: Team; away: Team };
  isLoading: boolean;
  t: (key: string, params?: any) => string;
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-700/50 p-3 rounded-lg text-center border border-gray-600/50 animate-pulse"></div>
    );
  }

  if (!result.predictedOutcome) {
    return null;
  }

  const outcomeTranslations: Record<string, string> = {
    "Home Win": t("outcome_home_win"),
    "Away Win": t("outcome_away_win"),
    Draw: t("outcome_draw"),
  };

  const predictedOutcomeText =
    outcomeTranslations[result.predictedOutcome] || result.predictedOutcome;
  const actualOutcomeText = result.actualOutcome
    ? outcomeTranslations[result.actualOutcome] || result.actualOutcome
    : null;

  if (!result.isFinished) {
    const predictedTeam =
      result.predictedOutcome === "Home Win"
        ? teams.home
        : result.predictedOutcome === "Away Win"
        ? teams.away
        : null;
    return (
      <div className="w-full h-full flex flex-col justify-between space-y-2 bg-[var(--brand-accent)]/5 p-3 rounded-lg text-center border border-[var(--brand-accent)]/20">
        <h4 className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Sparkles size={14} /> {t("fanskor_prediction")}
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
          <p className="text-base md:text-lg font-black text-white">
            {predictedOutcomeText}
          </p>
        </div>
        <p className="text-xs md:text-sm font-semibold text-text-muted">
          {t("confidence_percent", { confidence: result.confidence })}
        </p>
      </div>
    );
  }

  const wasCorrect = result.actualOutcome === result.predictedOutcome;
  const bgColor = wasCorrect ? "bg-green-500/10" : "bg-red-500/10";
  const textColor = wasCorrect ? "text-green-400" : "text-red-400";
  const Icon = wasCorrect ? CheckCircle : XCircle;

  return (
    <div
      className={`w-full h-full flex flex-col justify-center space-y-2 ${bgColor} p-3 rounded-lg text-center`}
    >
      <h4
        className={`text-xs font-bold ${textColor} uppercase tracking-wider flex items-center justify-center gap-1.5`}
      >
        <Icon size={14} />{" "}
        {wasCorrect ? t("prediction_hit") : t("prediction_missed")}
      </h4>
      {wasCorrect ? (
        <p className="text-lg font-black text-white">{predictedOutcomeText}</p>
      ) : (
        <div className="text-sm text-white">
          <p>
            {t("predicted_label")}:{" "}
            <span className="font-bold">{predictedOutcomeText}</span>
          </p>
          <p className={`${textColor}`}>
            {t("actual_label")}:{" "}
            <span className="font-bold">{actualOutcomeText}</span>
          </p>
        </div>
      )}
    </div>
  );
};

const BookmakerOddsWidget = ({
  odds,
  predictionOdds,
  teams,
  isLoading,
  t,
}: {
  odds: Odds;
  predictionOdds: PredictionOdds;
  teams: { home: Team; away: Team };
  isLoading: boolean;
  t: (key: string, params?: any) => string;
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-700/50 p-3 rounded-lg text-center border border-gray-600/50 animate-pulse"></div>
    );
  }

  const displayData = useMemo(() => {
    if (odds) {
      const favoriteOutcome =
        parseFloat(odds.home || "999") <= parseFloat(odds.draw || "999") &&
        parseFloat(odds.home || "999") <= parseFloat(odds.away || "999")
          ? "home"
          : parseFloat(odds.away || "999") <= parseFloat(odds.home || "999") &&
            parseFloat(odds.away || "999") <= parseFloat(odds.draw || "999")
          ? "away"
          : "draw";
      return {
        source: "bookmaker",
        odds,
        favoriteOutcome,
        title: t("best_odds"),
      };
    }
    if (predictionOdds) {
      const convertedOdds = {
        home: (100 / predictionOdds.home).toFixed(2),
        draw: (100 / predictionOdds.draw).toFixed(2),
        away: (100 / predictionOdds.away).toFixed(2),
      };
      const favoriteOutcome =
        predictionOdds.home >= predictionOdds.draw &&
        predictionOdds.home >= predictionOdds.away
          ? "home"
          : predictionOdds.away >= predictionOdds.home &&
            predictionOdds.away >= predictionOdds.draw
          ? "away"
          : "draw";
      return {
        source: "fanskor",
        odds: convertedOdds,
        favoriteOutcome,
        title: t("fanskor_odds"),
      };
    }
    return null;
  }, [odds, predictionOdds, t]);

  if (!displayData) return null;

  const { source, odds: currentOdds, favoriteOutcome, title } = displayData;

  const Icon = source === "bookmaker" ? TrendingUp : Sparkles;
  const iconColor =
    source === "bookmaker" ? "text-text-muted" : "text-[var(--brand-accent)]";

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-2 bg-brand-dark/30 p-3 rounded-lg text-center border border-gray-700/50">
      <h4
        className={`text-xs font-bold ${iconColor} uppercase tracking-wider flex items-center justify-center gap-1.5`}
      >
        <Icon size={14} /> {title}
      </h4>
      <div className="flex items-stretch justify-center gap-1 bg-gray-900/50 p-1 rounded-md">
        <div
          className={`flex-1 flex flex-col items-center justify-center p-1 rounded-md transition-colors duration-200 ${
            favoriteOutcome === "home" ? "bg-green-500/20" : ""
          }`}
        >
          <span className="text-xs font-semibold text-green-400">
            {t("home_short")}
          </span>
          <p className="font-black text-white text-base md:text-lg">
            {currentOdds.home || "-"}
          </p>
        </div>
        <div
          className={`flex-1 flex flex-col items-center justify-center p-1 rounded-md transition-colors duration-200 ${
            favoriteOutcome === "draw" ? "bg-amber-500/20" : ""
          }`}
        >
          <span className="text-xs font-semibold text-amber-400">
            {t("draw_short")}
          </span>
          <p className="font-black text-white text-base md:text-lg">
            {currentOdds.draw || "-"}
          </p>
        </div>
        <div
          className={`flex-1 flex flex-col items-center justify-center p-1 rounded-md transition-colors duration-200 ${
            favoriteOutcome === "away" ? "bg-blue-500/20" : ""
          }`}
        >
          <span className="text-xs font-semibold text-blue-400">
            {t("away_short")}
          </span>
          <p className="font-black text-white text-base md:text-lg">
            {currentOdds.away || "-"}
          </p>
        </div>
      </div>
      <a
        href="#"
        className="block text-[10px] text-brand-muted hover:text-white"
      >
        {source === "bookmaker"
          ? t("from_our_partners")
          : t("our_data_driven_odds")}
      </a>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const MatchHeader: React.FC<MatchHeaderProps> = ({ fixture }) => {
  const { t, locale } = useTranslation();
  const { teams, league, fixture: fixtureDetails, goals, score } = fixture;

  const isLive = useMemo(
    () => ["1H", "HT", "2H", "ET", "P"].includes(fixtureDetails.status.short),
    [fixtureDetails.status.short]
  );
  const isFinished = useMemo(
    () => ["FT", "AET", "PEN"].includes(fixtureDetails.status.short),
    [fixtureDetails.status.short]
  );

  const { data: enrichmentData, isLoading: isLoadingEnrichment } = useQuery({
    queryKey: ["predictionData", fixtureDetails.id.toString()],
    queryFn: () =>
      fetchHeaderEnrichmentData(fixtureDetails.id.toString(), locale!),
    enabled: !!fixtureDetails.id && !!locale,
    staleTime: 1000 * 60 * 5,
  });

  const { data: odds, isLoading: isLoadingOdds } = useQuery<Odds>({
    queryKey: ["headerOdds", fixtureDetails.id],
    queryFn: () => fetchHeaderOdds(fixtureDetails.id),
    enabled: !!fixtureDetails.id && !isFinished,
    staleTime: 1000 * 60 * 60,
  });

  const finalScoreHome = score?.fulltime?.home ?? goals?.home;
  const finalScoreAway = score?.fulltime?.away ?? goals?.away;

  const predictionResult = useMemo(() => {
    let result = {
      isFinished,
      predictedOutcome: null,
      confidence: 0,
      actualOutcome: null,
    };
    if (enrichmentData?.customPrediction) {
      const pred = enrichmentData.customPrediction;
      const maxConfidence = Math.max(pred.home, pred.draw, pred.away);
      result.predictedOutcome =
        maxConfidence === pred.home
          ? "Home Win"
          : maxConfidence === pred.away
          ? "Away Win"
          : "Draw";
      result.confidence = maxConfidence;
    }
    if (isFinished) {
      result.actualOutcome = teams.home.winner
        ? "Home Win"
        : teams.away.winner
        ? "Away Win"
        : "Draw";
    }
    return result;
  }, [enrichmentData, isFinished, teams]);

  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-lg mb-4">
      <div className="p-2 bg-brand-dark/30 flex items-center justify-between text-xs border-b border-gray-700/50">
        <Link
          href={generateLeagueSlug(league.name, league.id)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {league.logo && (
            <Image
              src={proxyImageUrl(league.logo)}
              alt={league.name}
              width={16}
              height={16}
            />
          )}
          <span className="font-semibold text-text-secondary">
            {league.name}
          </span>
        </Link>
        <div className="flex items-center gap-3 text-text-muted">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={12} />
            <span>{format(new Date(fixtureDetails.date), "dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{format(new Date(fixtureDetails.date), "HH:mm")}</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4">
        <div className="flex md:grid md:grid-cols-3 items-center gap-2 md:gap-4">
          <div className="flex-1 flex flex-col md:flex-row items-center justify-start text-center md:text-left gap-3">
            <Link href={generateTeamSlug(teams.home.name, teams.home.id)}>
              <Image
                src={proxyImageUrl(teams.home.logo)}
                alt={teams.home.name}
                width={80}
                height={80}
                priority={true}
                className="w-12 h-12 md:w-16 md:h-16 object-contain hover:scale-110 transition-transform"
              />
            </Link>
            <h2 className="font-bold text-white text-base md:text-xl truncate w-full">
              {teams.home.name}
            </h2>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-start text-center gap-2">
            <span className="text-3xl md:text-5xl font-black text-white">
              {finalScoreHome ?? "?"} - {finalScoreAway ?? "?"}
            </span>
            <span
              className={`text-xs md:text-sm font-semibold px-3 py-1 rounded-full ${
                isLive
                  ? "bg-green-500/20 text-green-400 animate-pulse"
                  : "bg-brand-dark text-text-muted"
              }`}
            >
              {fixtureDetails.status.long}{" "}
              {isLive && `(${fixtureDetails.status.elapsed}')`}
            </span>
          </div>

          <div className="flex-1 flex flex-col md:flex-row-reverse items-center justify-end text-center md:text-right gap-3">
            <Link href={generateTeamSlug(teams.away.name, teams.away.id)}>
              <Image
                src={proxyImageUrl(teams.away.logo)}
                alt={teams.away.name}
                width={80}
                height={80}
                priority={true}
                className="w-12 h-12 md:w-16 md:h-16 object-contain hover:scale-110 transition-transform"
              />
            </Link>
            <h2 className="font-bold text-white text-base md:text-xl truncate w-full">
              {teams.away.name}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mx-auto">
          <PredictionResultWidget
            result={predictionResult}
            teams={teams}
            isLoading={isLoadingEnrichment}
            t={t}
          />
          <BookmakerOddsWidget
            odds={odds}
            predictionOdds={enrichmentData?.customPrediction}
            teams={teams}
            isLoading={isLoadingOdds || isLoadingEnrichment}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};
