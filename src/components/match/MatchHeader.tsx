// src/components/match/MatchHeader.tsx
"use client"; // This component remains a Client Component

import Image from "next/image";
import { format } from "date-fns";
import { useMemo } from "react";
import { ChevronRight, Clock, CalendarDays, BarChart2 } from "lucide-react";
import Link from "next/link";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { generateTeamSlug } from "@/lib/generate-team-slug";
// Removed useTranslation import
// import { useTranslation } from '@/hooks/useTranslation';

// Assuming these types are defined elsewhere or simplified for this example
interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Fixture {
  fixture: any;
  id: number;
  date: string;
  timestamp: number;
  timezone: string;
  status: {
    long: string;
    short: any;
    elapsed: number | null;
  };
  venue: {
    id: number;
    name: string;
    city: string;
  };
  teams: {
    home: Team;
    away: Team;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

interface MatchHeaderProps {
  fixture: Fixture;
  analytics: {
    prediction?: any;
    homeTeamStats?: any;
    awayTeamStats?: any;
    customPrediction?: any;
    customOdds?: any;
    bookmakerOdds?: any;
  };
  // Now directly receives the untranslated string
  matchSeoDescription: string;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({
  fixture,
  analytics,
  matchSeoDescription,
}) => {
  // Removed useTranslation hook call
  // const { t } = useTranslation();

  const homeTeam = fixture?.teams?.home;
  const awayTeam = fixture?.teams?.away;
  const league = fixture?.league;
  const status = fixture?.fixture.status;
  const venue = fixture?.fixture.venue;
  const goals = fixture?.goals;
  const score = fixture?.score;
  const fixtureDate = fixture?.fixture;

  if (
    !homeTeam ||
    !awayTeam ||
    !league ||
    !status ||
    !venue ||
    !score ||
    !goals ||
    !fixtureDate
  ) {
    console.error("[MatchHeader] Essential fixture data missing:", {
      fixture,
      homeTeam,
      awayTeam,
      league,
      status,
      venue,
      score,
      goals,
      fixtureDate,
    });
    return (
      <div className="text-red-400 p-4">Error: Match data incomplete.</div>
    );
  }

  const validFixtureDate = useMemo(() => {
    if (
      fixtureDate &&
      typeof fixtureDate === "string" &&
      !isNaN(new Date(fixtureDate).getTime())
    ) {
      return new Date(fixtureDate);
    }
    console.warn(
      `[MatchHeader] Invalid or missing fixture.date received: "${fixtureDate}". Using current date as fallback.`
    );
    return new Date();
  }, [fixtureDate]);

  const formattedDate = useMemo(
    () => format(validFixtureDate, "dd MMMM yyyy"),
    [validFixtureDate]
  );
  const formattedTime = useMemo(
    () => format(validFixtureDate, "HH:mm"),
    [validFixtureDate]
  );

  const prediction = useMemo(() => {
    if (analytics?.customPrediction) {
      return analytics.customPrediction;
    }
    if (analytics?.prediction && analytics.prediction?.percent) {
      return {
        home: analytics.prediction.percent.home,
        draw: analytics.prediction.percent.draw,
        away: analytics.prediction.percent.away,
      };
    }
    return null;
  }, [analytics?.customPrediction, analytics?.prediction]);

  const winningPrediction = useMemo(() => {
    if (!prediction) return null;
    const max = Math.max(prediction.home, prediction.draw, prediction.away);
    if (max === prediction.home)
      return { team: homeTeam, percent: prediction.home };
    if (max === prediction.away)
      return { team: awayTeam, percent: prediction.away };
    return { team: null, percent: prediction.draw };
  }, [prediction, homeTeam, awayTeam]);

  const isLive = useMemo(() => {
    const liveStatuses = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"];
    return liveStatuses.includes(status?.short || "");
  }, [status?.short]);

  const finalScoreHome =
    score?.fulltime?.home !== null ? score.fulltime.home : goals?.home;
  const finalScoreAway =
    score?.fulltime?.away !== null ? score.fulltime.away : goals?.away;

  // This text is now passed as an already translated prop
  // const translatedMatchSeoDescription = t('match_seo_description', {
  //   home_team_name: matchSeoDescriptionData.homeTeamName,
  //   away_team_name: matchSeoDescriptionData.awayTeamName
  // });

  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-lg mb-4">
      {/* League Info & Breadcrumbs */}
      <div className="p-4 bg-gray-800/50 flex items-center justify-between text-brand-muted text-sm">
        <div className="flex items-center gap-2">
          <Link
            href={`/football/leagues`}
            className="hover:text-white transition-colors"
          >
            Leagues
          </Link>
          <ChevronRight size={14} />
          <Link
            href={generateLeagueSlug(league.name, league.id)}
            className="hover:text-white transition-colors"
          >
            {league.name}
          </Link>
        </div>
        <div className="text-xs">{league.round}</div>
      </div>

      {/* Match Overview - Teams, Score, Status */}
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <div className="flex items-center w-full justify-around mb-6 gap-4">
          {/* Home Team */}
          <Link
            href={generateTeamSlug(homeTeam.name, homeTeam.id)}
            className="flex flex-col items-center gap-3 flex-1 min-w-0"
          >
            <Image
              src={proxyImageUrl(homeTeam.logo)}
              alt={homeTeam.name}
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
            <span className="font-bold text-white text-xl truncate">
              {homeTeam.name}
            </span>
          </Link>

          {/* Score / VS */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 mx-4">
            {status?.short === "NS" ? (
              <span className="text-4xl font-extrabold text-white">VS</span>
            ) : (
              <span className="text-4xl font-extrabold text-white">
                {finalScoreHome !== null ? finalScoreHome : "?"} -{" "}
                {finalScoreAway !== null ? finalScoreAway : "?"}
              </span>
            )}
            <span
              className={`text-sm font-semibold mt-2 px-3 py-1 rounded-full ${
                isLive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-700/50 text-brand-muted"
              }`}
            >
              {status?.long || "N/A"}{" "}
              {status?.elapsed !== null && isLive && `(${status.elapsed}')`}
            </span>
          </div>

          {/* Away Team */}
          <Link
            href={generateTeamSlug(awayTeam.name, awayTeam.id)}
            className="flex flex-col items-center gap-3 flex-1 min-w-0"
          >
            <Image
              src={proxyImageUrl(awayTeam.logo)}
              alt={awayTeam.name}
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
            <span className="font-bold text-white text-xl truncate">
              {awayTeam.name}
            </span>
          </Link>
        </div>

        {/* Match Details: Date, Time, Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-brand-muted text-sm border-t border-b border-gray-700/50 py-4 w-full justify-center">
          <div className="flex items-center justify-center gap-2">
            <CalendarDays size={18} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock size={18} />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <BarChart2 size={18} />
            <span>
              {venue?.name || "N/A"} ({venue?.city || "N/A"})
            </span>
          </div>
        </div>

        {/* Prediction Display */}
        {winningPrediction && (
          <div className="mt-4 text-white font-semibold text-lg flex items-center justify-center gap-2">
            <span className="text-brand-muted">Prediction:</span>
            {winningPrediction.team ? (
              <span className="flex items-center gap-1">
                <Image
                  src={proxyImageUrl(winningPrediction.team.logo)}
                  alt={winningPrediction.team.name}
                  width={24}
                  height={24}
                />
                {winningPrediction.team.name}
              </span>
            ) : (
              <span>Draw</span>
            )}
            <span className="text-brand-purple">
              ({winningPrediction.percent}%)
            </span>
          </div>
        )}
      </div>

      {/* --- SEO OPTIMIZATION TEXT --- */}
      {/* This text is now passed as an already translated prop */}
      <div className="p-6 border-t border-gray-700/50">
        <p className=" leading-relaxed italic text-[#a3a3a3]">
          {matchSeoDescription}
        </p>
      </div>
    </div>
  );
};

export default MatchHeader;
