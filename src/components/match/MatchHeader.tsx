// src/components/match/MatchHeader.tsx
"use client";

import Image from "next/image";
import { format } from "date-fns";
import { useMemo } from "react";
import { Clock, CalendarDays, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { generateTeamSlug } from "@/lib/generate-team-slug";

// --- TYPE DEFINITIONS (for clarity) ---
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
  status: { long: string; short: any; elapsed: number | null };
  venue: { id: number; name: string; city: string };
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
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}
interface MatchHeaderProps {
  fixture: Fixture;
  analytics: any;
  matchSeoDescription: string;
}

// --- NEW SUB-COMPONENT: StatComparisonRow ---
const StatComparisonRow = ({
  icon: Icon,
  label,
  homeValue,
  awayValue,
  homeColor = "bg-[var(--brand-accent)]",
  awayColor = "bg-blue-500",
}: {
  icon: React.ElementType;
  label: string;
  homeValue: number;
  awayValue: number;
  homeColor?: string;
  awayColor?: string;
}) => {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-white">{homeValue.toFixed(1)}</span>
        <div className="flex items-center gap-1.5 font-semibold text-text-muted">
          <Icon size={14} /> {label}
        </div>
        <span className="font-bold text-white">{awayValue.toFixed(1)}</span>
      </div>
      <div className="flex w-full h-1.5 rounded-full bg-[var(--color-primary)] overflow-hidden">
        <div
          className={`${homeColor} rounded-l-full`}
          style={{ width: `${homePercent}%` }}
        ></div>
        <div
          className={`${awayColor} rounded-r-full`}
          style={{ width: `${100 - homePercent}%` }}
        ></div>
      </div>
    </div>
  );
};

// --- MAIN ENHANCED COMPONENT ---
export const MatchHeader: React.FC<MatchHeaderProps> = ({
  fixture,
  analytics,
  matchSeoDescription,
}) => {
  const { teams, league, fixture: fixtureDetails, goals, score } = fixture;
  const isLive = useMemo(
    () =>
      ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
        fixtureDetails.status?.short || ""
      ),
    [fixtureDetails.status?.short]
  );
  const finalScoreHome = score?.fulltime?.home ?? goals?.home;
  const finalScoreAway = score?.fulltime?.away ?? goals?.away;

  const { homeStrength, awayStrength, prediction, customOdds } = useMemo(() => {
    const homeStats = analytics?.homeTeamStats;
    const awayStats = analytics?.awayTeamStats;
    const calcAttack = (avgGoals: string | number) =>
      Math.min(10, (parseFloat(avgGoals as string) / 2.0) * 10);
    const calcDefense = (avgGoals: string | number) =>
      Math.min(10, (1.5 / parseFloat(avgGoals as string)) * 10);

    return {
      homeStrength: {
        attack: homeStats ? calcAttack(homeStats.goals.for.average.total) : 5,
        defense: homeStats
          ? calcDefense(homeStats.goals.against.average.total)
          : 5,
      },
      awayStrength: {
        attack: awayStats ? calcAttack(awayStats.goals.for.average.total) : 5,
        defense: awayStats
          ? calcDefense(awayStats.goals.against.average.total)
          : 5,
      },
      prediction: analytics?.customPrediction || null,
      customOdds: analytics?.customOdds || null,
    };
  }, [analytics]);

  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-lg mb-4">
      {/* Top Banner: Unchanged */}
      <div className="p-4 bg-[var(--color-primary)]/50 flex flex-col md:flex-row items-center justify-between gap-2 text-sm">
        <Link
          href={generateLeagueSlug(league.name, league.id)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src={proxyImageUrl(league.logo)}
            alt={league.name}
            width={24}
            height={24}
          />
          <span className="font-bold text-white">{league.name}</span>
        </Link>
        <div className="flex items-center gap-4 text-text-muted">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            <span>{format(new Date(fixtureDetails.date), "dd MMMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{format(new Date(fixtureDetails.date), "HH:mm")}</span>
          </div>
        </div>
      </div>

      {/* Main Matchup Display: Unchanged */}
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <div className="flex items-center w-full justify-around mb-4 gap-4">
          <Link
            href={generateTeamSlug(teams.home.name, teams.home.id)}
            className="flex flex-col items-center gap-3 flex-1 min-w-0"
          >
            <Image
              src={proxyImageUrl(teams.home.logo)}
              alt={teams.home.name}
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
            <h2 className="font-bold text-white text-xl truncate">
              {teams.home.name}
            </h2>
          </Link>
          <div className="flex flex-col items-center justify-center flex-shrink-0">
            {isLive || fixtureDetails.status.short !== "NS" ? (
              <span className="text-5xl font-black text-white">
                {finalScoreHome ?? "?"} - {finalScoreAway ?? "?"}
              </span>
            ) : (
              <span className="text-4xl font-extrabold text-text-muted">
                VS
              </span>
            )}
            <span
              className={`text-sm font-semibold mt-2 px-3 py-1 rounded-full ${
                isLive
                  ? "bg-green-500/20 text-green-400 animate-pulse"
                  : "bg-[var(--color-primary)] text-text-muted"
              }`}
            >
              {fixtureDetails.status.long}{" "}
              {isLive && `(${fixtureDetails.status.elapsed}')`}
            </span>
          </div>
          <Link
            href={generateTeamSlug(teams.away.name, teams.away.id)}
            className="flex flex-col items-center gap-3 flex-1 min-w-0"
          >
            <Image
              src={proxyImageUrl(teams.away.logo)}
              alt={teams.away.name}
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
            <h2 className="font-bold text-white text-xl truncate">
              {teams.away.name}
            </h2>
          </Link>
        </div>
      </div>

      {/* --- NEW, MINIMALIST ANALYSIS SECTION --- */}
      {prediction && (
        <div className="bg-[var(--color-primary)]/40 p-4 md:p-6 space-y-6">
          <div className="max-w-md mx-auto space-y-4">
            <StatComparisonRow
              icon={Zap}
              label="Attack Strength"
              homeValue={homeStrength.attack}
              awayValue={awayStrength.attack}
              homeColor="bg-[var(--brand-accent)]"
              awayColor="bg-blue-500"
            />
            <StatComparisonRow
              icon={Shield}
              label="Defense Strength"
              homeValue={homeStrength.defense}
              awayValue={awayStrength.defense}
              homeColor="bg-[var(--brand-accent)]"
              awayColor="bg-blue-500"
            />
          </div>

          <div className="max-w-lg mx-auto text-center space-y-3 pt-6 border-t border-gray-700/50">
            <h4 className="font-semibold text-text-muted">Win Probability</h4>
            <div className="flex w-full h-2.5 rounded-full overflow-hidden mt-2 bg-gray-700">
              <div
                className="bg-[var(--brand-accent)]"
                style={{ width: `${prediction.home}%` }}
                title={`Home: ${prediction.home}%`}
              ></div>
              <div
                className="bg-gray-400"
                style={{ width: `${prediction.draw}%` }}
                title={`Draw: ${prediction.draw}%`}
              ></div>
              <div
                className="bg-blue-500"
                style={{ width: `${prediction.away}%` }}
                title={`Away: ${prediction.away}%`}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-white">{prediction.home}%</span>
              <span className="font-bold text-white">{prediction.draw}%</span>
              <span className="font-bold text-white">{prediction.away}%</span>
            </div>
          </div>

          {customOdds && (
            <div className="max-w-lg mx-auto text-center space-y-3 pt-6 border-t border-gray-700/50">
              <h4 className="font-semibold text-text-muted">Fanskor Odds</h4>
              <div className="grid grid-cols-3 gap-3 text-white">
                <div className="bg-[var(--color-primary)] p-3 rounded-lg">
                  <span className="text-sm text-text-muted">Home (1)</span>
                  <p className="text-2xl font-black">{customOdds.home}</p>
                </div>
                <div className="bg-[var(--color-primary)] p-3 rounded-lg">
                  <span className="text-sm text-text-muted">Draw (X)</span>
                  <p className="text-2xl font-black">{customOdds.draw}</p>
                </div>
                <div className="bg-[var(--color-primary)] p-3 rounded-lg">
                  <span className="text-sm text-text-muted">Away (2)</span>
                  <p className="text-2xl font-black">{customOdds.away}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
