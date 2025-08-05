// ===== src/components/team/TeamFixturesWidget.tsx =====
"use client";

import { useState, useMemo } from "react";
import { Info, CalendarClock } from "lucide-react";
import MatchListItem from "../MatchListItem";
import { useTranslation } from "@/hooks/useTranslation";

interface TeamFixturesWidgetProps {
  fixtures: any[];
}

export default function TeamFixturesWidget({
  fixtures,
}: TeamFixturesWidgetProps) {
  // THE FIX IS HERE: Set the initial state to 'results'
  const [activeTab, setActiveTab] = useState<"upcoming" | "results">("results");
  const { t } = useTranslation();

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
      // Results should be shown in reverse chronological order (most recent first)
      return sortedFixtures
        .filter((m: any) =>
          ["FT", "AET", "PEN"].includes(m.fixture.status.short)
        )
        .reverse();
    }
  }, [fixtures, activeTab]);

  return (
    <div className="bg-brand-secondary rounded-xl">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarClock size={22} />
          {t("match_schedule")}
        </h3>
        <div className="flex items-center gap-1 bg-[var(--color-primary)] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            {t("upcoming")}
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              activeTab === "results"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            {t("results")}
          </button>
        </div>
      </div>

      <div className="p-2 space-y-2 max-h-[800px] overflow-y-auto custom-scrollbar">
        {!fixtures || fixtures.length === 0 ? (
          <div className="text-center py-20 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p className="font-semibold">{t("fixture_data_unavailable")}</p>
          </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match: any) => (
            <MatchListItem key={match.fixture.id} match={match} />
          ))
        ) : (
          <div className="text-center py-20 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p className="font-semibold">
              {t("no_matches_found_for_tab", { tab: activeTab })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
