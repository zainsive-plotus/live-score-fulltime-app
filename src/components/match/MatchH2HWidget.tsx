import { memo, useMemo } from "react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { proxyImageUrl } from "@/lib/image-proxy"; // Ensure proxyImageUrl is imported

// This is the main exported widget component.
const MatchH2HWidget = memo(function MatchH2HWidget({
  h2h,
  teams,
  currentFixtureId,
}: {
  h2h: any[];
  teams: any;
  currentFixtureId: string;
}) {
  // --- 1. Data Processing with useMemo for Performance ---
  const { pastMatches, summaryStats } = useMemo(() => {
    const filteredPastMatches = h2h.filter(
      (match) => match.fixture.id.toString() !== currentFixtureId
    );
    let stats = { homeWins: 0, awayWins: 0, draws: 0 };

    filteredPastMatches.forEach((match) => {
      const home = match.teams.home;
      const away = match.teams.away;
      const goals = match.goals;

      if (goals.home === goals.away) {
        stats.draws++;
      } else if (goals.home > goals.away) {
        if (home.id === teams.home.id) stats.homeWins++;
        else stats.awayWins++;
      } else {
        if (away.id === teams.home.id) stats.homeWins++;
        else stats.awayWins++;
      }
    });

    return { pastMatches: filteredPastMatches, summaryStats: stats };
  }, [h2h, teams, currentFixtureId]);

  // --- 2. Early Return for "No Data" Case ---
  if (pastMatches.length === 0) {
    return (
      <div className="bg-brand-secondary rounded-xl p-4">
        <h3 className="text-lg font-bold border-b border-gray-700/50 pb-4 mb-4">
          Head-to-Head
        </h3>
        <p className="text-text-muted text-center py-4">
          No previous encounters found between these two teams.
        </p>
      </div>
    );
  }

  const totalMatches =
    summaryStats.homeWins + summaryStats.awayWins + summaryStats.draws;
  const homeWinPercent =
    totalMatches > 0 ? (summaryStats.homeWins / totalMatches) * 100 : 0;
  const drawPercent =
    totalMatches > 0 ? (summaryStats.draws / totalMatches) * 100 : 0;
  const awayWinPercent = 100 - homeWinPercent - drawPercent;

  // --- 3. JSX Rendering ---
  return (
    <div className="bg-brand-secondary rounded-xl p-4">
      <h3 className="text-lg font-bold border-b border-gray-700/50 pb-4 mb-4">
        Head-to-Head
      </h3>
      <div>
        {/* "Tale of the Tape" Summary Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Image
                src={proxyImageUrl(teams.home.logo)}
                alt={teams.home.name}
                width={20}
                height={20}
              />
              <span>{summaryStats.homeWins} Wins</span>
            </div>
            <span className="text-text-muted">{summaryStats.draws} Draws</span>
            <div className="flex items-center gap-2">
              <span>{summaryStats.awayWins} Wins</span>
              <Image
                src={proxyImageUrl(teams.away.logo)}
                alt={teams.away.name}
                width={20}
                height={20}
              />
            </div>
          </div>
          {/* The visual win-distribution bar */}
          <div
            className="flex w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div
              className="bg-brand-purple"
              style={{ width: `${homeWinPercent}%` }}
            ></div>
            <div
              className="bg-gray-500"
              style={{ width: `${drawPercent}%` }}
            ></div>
            <div
              className="bg-brand-highlight"
              style={{ width: `${awayWinPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Recent Encounters List */}
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-text-muted mb-2">
            Recent Encounters
          </h4>
          {pastMatches.slice(0, 5).map((match: any) => {
            let resultType = "draw";
            if (match.goals.home > match.goals.away) {
              resultType =
                match.teams.home.id === teams.home.id ? "win" : "loss";
            } else if (match.goals.away > match.goals.home) {
              resultType =
                match.teams.away.id === teams.home.id ? "win" : "loss";
            }

            const resultClasses = {
              win: "border-l-4 border-green-500 bg-green-900/20",
              loss: "border-l-4 border-red-500 bg-red-900/20",
              draw: "border-l-4 border-gray-500 bg-gray-900/20",
            };

            return (
              <Link
                href={`/football/match/${generateMatchSlug(
                  match.teams.home,
                  match.teams.away,
                  match.fixture.id
                )}`}
                key={match.fixture.id}
                // Apply result classes to the main link
                className={`block p-3 rounded-md flex items-center justify-between gap-2 transition-colors hover:bg-gray-700/50 ${
                  resultClasses[resultType as keyof typeof resultClasses]
                }`}
              >
                {/* Date Column */}
                <div className="text-center w-16 flex-shrink-0">
                  <p className="text-sm font-semibold text-white">
                    {format(new Date(match.fixture.date), "dd MMM")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {format(new Date(match.fixture.date), "yyyy")}
                  </p>
                </div>

                {/* Teams and Score Column */}
                {/* --- FIX: Added min-w-0 and adjusted flex behavior --- */}
                <div className="flex-1 flex items-center justify-center gap-2 min-w-0 text-sm font-semibold">
                  <span className="text-right flex-1 truncate">
                    {match.teams.home.name}
                  </span>
                  <Image
                    src={proxyImageUrl(match.teams.home.logo)}
                    alt={match.teams.home.name}
                    width={24}
                    height={24}
                    className="flex-shrink-0"
                  />
                  <span
                    style={{ backgroundColor: "var(--color-primary)" }}
                    className="px-2 py-1 rounded-md text-base font-black flex-shrink-0" // Added flex-shrink-0
                  >
                    {match.goals.home} - {match.goals.away}
                  </span>
                  <Image
                    src={proxyImageUrl(match.teams.away.logo)}
                    alt={match.teams.away.name}
                    width={24}
                    height={24}
                    className="flex-shrink-0"
                  />
                  <span className="text-left flex-1 truncate">
                    {match.teams.away.name}
                  </span>
                </div>

                {/* League Name Column (hidden on mobile) */}
                <div className="w-1/5 text-right text-xs text-text-muted hidden sm:block flex-shrink-0 truncate">
                  {" "}
                  {/* Changed from md:block to sm:block, added flex-shrink-0 */}
                  {match.league.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default MatchH2HWidget;
