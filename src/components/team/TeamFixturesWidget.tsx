// src/components/team/TeamFixturesWidget.tsx
"use client";

import { useState, useMemo } from "react";
import { Info, CalendarClock } from "lucide-react"; // Using a more descriptive icon
import MatchListItem, { MatchListItemSkeleton } from "../MatchListItem";

interface TeamFixturesWidgetProps {
  fixtures: any[];
}

export default function TeamFixturesWidget({
  fixtures,
}: TeamFixturesWidgetProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "results">(
    "upcoming"
  );

  const filteredMatches = useMemo(() => {
    if (!fixtures) return [];

    const sortedFixtures = [...fixtures].sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    if (activeTab === "upcoming") {
      return sortedFixtures.filter(
        (m: any) => !["FT", "AET", "PEN"].includes(m.fixture.status.short)
      );
    } else {
      return sortedFixtures
        .filter((m: any) =>
          ["FT", "AET", "PEN"].includes(m.fixture.status.short)
        )
        .reverse(); // Show most recent results first
    }
  }, [fixtures, activeTab]);

  return (
    <div className="bg-brand-secondary rounded-xl">
      {/* --- NEW: Unified Header --- */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarClock size={22} />
          Match Schedule
        </h3>
        {/* --- NEW: Segmented Control for Filters --- */}
        <div className="flex items-center gap-1 bg-[var(--color-primary)] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              activeTab === "results"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="p-2 space-y-2 max-h-[800px] overflow-y-auto custom-scrollbar">
        {fixtures.length === 0 ? (
          <div className="text-center py-20 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p className="font-semibold">Fixture data not available.</p>
          </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match: any) => (
            <MatchListItem key={match.fixture.id} match={match} />
          ))
        ) : (
          <div className="text-center py-20 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p className="font-semibold">No {activeTab} matches found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
