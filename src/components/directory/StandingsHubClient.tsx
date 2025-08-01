// ===== src/components/directory/StandingsHubClient.tsx =====

"use client";

import { useState, useMemo } from "react";
import { League } from "@/types/api-football";
import FeaturedLeagueCard, {
  FeaturedLeagueCardSkeleton,
} from "./FeaturedLeagueCard";
import LeagueStandingCard, {
  LeagueStandingCardSkeleton,
} from "./LeagueStandingCard";
import { Search, SearchX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface StandingsHubClientProps {
  leagues: League[];
}

const FEATURED_LEAGUE_IDS = new Set([39, 140, 135, 78, 61, 2]);

// ***** FIX IS HERE: Provide a default empty array for the leagues prop *****
export default function StandingsHubClient({
  leagues = [],
}: StandingsHubClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  const featuredLeagues = useMemo(() => {
    return leagues.filter((l) => FEATURED_LEAGUE_IDS.has(l.id));
  }, [leagues]);

  const filteredLeagues = useMemo(() => {
    if (searchTerm.length < 3) {
      return leagues;
    }
    return leagues.filter(
      (league) =>
        league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        league.countryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leagues, searchTerm]);

  return (
    <div className="space-y-12">
      {/* Featured Section - only renders if not searching */}
      {searchTerm.length < 3 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            {t("featured_leagues")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredLeagues.length > 0
              ? featuredLeagues.map((league) => (
                  <FeaturedLeagueCard key={league.id} {...league} />
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <FeaturedLeagueCardSkeleton key={i} />
                ))}
          </div>
        </section>
      )}

      {/* All Leagues Section */}
      <section>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">{t("all_leagues")}</h2>
          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              size={20}
            />
            <input
              type="text"
              placeholder={t("search_leagues_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-3 pl-11 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            />
          </div>
        </div>

        {filteredLeagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLeagues.map((league) => (
              <LeagueStandingCard key={league.id} {...league} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-brand-secondary rounded-lg">
            <SearchX size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-xl font-bold text-white">
              {t("no_leagues_found_title")}
            </p>
            <p className="text-text-muted mt-2">
              {t("no_leagues_found_subtitle", { searchTerm })}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
