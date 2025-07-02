// src/components/match/MatchH2HWidget.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { ChevronRight, CalendarDays } from "lucide-react";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateMatchSlug } from "@/lib/generate-match-slug";
// No useTranslation import here for h2hSeoDescription
// import { useTranslation } from '@/hooks/useTranslation';

interface MatchH2HWidgetProps {
  h2h: any[]; // Array of past match fixtures
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  currentFixtureId: string;
  h2hSeoDescription: string; // This prop receives the static Turkish string
}

export default function MatchH2HWidget({
  h2h,
  teams,
  currentFixtureId,
  h2hSeoDescription,
}: MatchH2HWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const filteredH2H = useMemo(
    () =>
      h2h.filter((match) => match.fixture.id !== parseInt(currentFixtureId)),
    [h2h, currentFixtureId]
  );
  const displayedH2H = showAll ? filteredH2H : filteredH2H.slice(0, 5);

  const headToHeadRecords = useMemo(() => {
    if (!filteredH2H || filteredH2H.length === 0) {
      return { homeWins: 0, awayWins: 0, draws: 0 };
    }

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    filteredH2H.forEach((match: any) => {
      if (match.fixture.status.short === "FT") {
        if (match.teams.home.winner) {
          if (match.teams.home.id === teams.home.id) {
            homeWins++;
          } else {
            awayWins++;
          }
        } else if (match.teams.away.winner) {
          if (match.teams.away.id === teams.away.id) {
            homeWins++;
          } else {
            awayWins++;
          }
        } else {
          draws++;
        }
      }
    });

    return { homeWins, awayWins, draws };
  }, [filteredH2H, teams]);

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Head-to-Head</h2>

        {/* --- H2H SEO Optimization Text --- */}
        {/* This text is now passed as an already formed string from the Server Component */}
        <p className="italic text-[#a3a3a3] leading-relaxed mb-6">
          {h2hSeoDescription}
        </p>

        {filteredH2H.length === 0 ? (
          <p className="text-brand-muted text-center p-4">
            No head-to-head matches found.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 text-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <Image
                  src={teams.home.logo}
                  alt={teams.home.name}
                  width={50}
                  height={50}
                  className="w-12 h-12 object-contain mb-2"
                />
                <span className="text-white font-semibold text-lg">
                  {headToHeadRecords.homeWins}
                </span>
                <span className="text-brand-muted text-sm">Wins</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white font-semibold text-lg">
                  {headToHeadRecords.draws}
                </span>
                <span className="text-brand-muted text-sm">Draws</span>
              </div>
              <div className="flex flex-col items-center">
                <Image
                  src={teams.away.logo}
                  alt={teams.away.name}
                  width={50}
                  height={50}
                  className="w-12 h-12 object-contain mb-2"
                />
                <span className="text-white font-semibold text-lg">
                  {headToHeadRecords.awayWins}
                </span>
                <span className="text-brand-muted text-sm">Wins</span>
              </div>
            </div>

            <div className="space-y-3">
              {displayedH2H.map((match) => (
                <Link
                  key={match.fixture.id}
                  href={generateMatchSlug(
                    match.teams.home.name,
                    match.teams.away.name,
                    match.fixture.id
                  )}
                  className="block bg-gray-800/50 p-3 rounded-md hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-brand-muted" />
                      <span className="text-brand-muted">
                        {format(new Date(match.fixture.date), "dd MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src={match.teams.home.logo}
                          alt={match.teams.home.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-white font-medium">
                          {match.teams.home.name}
                        </span>
                        <span className="font-bold text-white text-lg">
                          {match.goals.home}
                        </span>
                      </div>
                      <span className="text-brand-muted"> - </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">
                          {match.goals.away}
                        </span>
                        <span className="text-white font-medium">
                          {match.teams.away.name}
                        </span>
                        <Image
                          src={match.teams.away.logo}
                          alt={match.teams.away.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredH2H.length > 5 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="bg-brand-purple text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {showAll ? "Show Less" : `Show All (${filteredH2H.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
