// src/components/team/TeamFixturesWidget.tsx
"use client";

import { useState, useMemo } from "react";
import { Info } from "lucide-react";
// We can reuse the same list item component for a consistent look
import MatchListItem from "../MatchListItem";

interface TeamFixturesWidgetProps {
  fixtures: any[]; // The array of fixtures fetched on the server
}

export default function TeamFixturesWidget({
  fixtures,
}: TeamFixturesWidgetProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "results">(
    "upcoming"
  );

  const filteredMatches = useMemo(() => {
    if (!fixtures) return [];

    // Sort all fixtures by date first to ensure correct order
    const sortedFixtures = [...fixtures].sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    if (activeTab === "upcoming") {
      // Filter for matches that are not finished
      return sortedFixtures.filter(
        (m: any) => !["FT", "AET", "PEN"].includes(m.fixture.status.short)
      );
    } else {
      // Filter for finished matches and reverse to show most recent first
      return sortedFixtures
        .filter((m: any) =>
          ["FT", "AET", "PEN"].includes(m.fixture.status.short)
        )
        .reverse();
    }
  }, [fixtures, activeTab]);

  return (
    <div className="bg-brand-secondary rounded-xl p-4">
      <div className="flex justify-end items-center mb-4">
        {/* The control tabs for switching between views */}
        <div className="flex items-center gap-1 bg-gray-700/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              activeTab === "results"
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700"
            }`}
          >
            Results
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 pr-2">
        {filteredMatches && filteredMatches.length > 0 ? (
          filteredMatches.map((match: any) => (
            <MatchListItem key={match.fixture.id} match={match} />
          ))
        ) : (
          <div className="text-center py-10 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p>No {activeTab} matches found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
