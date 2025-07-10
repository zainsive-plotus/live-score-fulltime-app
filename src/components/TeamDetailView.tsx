// src/components/TeamDetailView.tsx
"use client";

// We no longer need useState
// import { useState } from "react";

// Import all the widget components we will be using
import TeamHeader from "./team/TeamHeader";
import TeamSquadWidget from "./team/TeamSquadWidget"; // <-- The newly renamed widget
import TeamFixturesWidget from "./team/TeamFixturesWidget";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import { generateLeagueSlug } from "@/lib/generate-league-slug";

export default function TeamDetailView({ teamData }: { teamData: any }) {
  // No longer need activeTab state
  // const [activeTab, setActiveTab] = useState(TABS[1]);

  const { teamInfo, squad, fixtures, standings } = teamData;
  const { team } = teamInfo;

  // Find the primary league from the standings data to pass to the widget
  const primaryLeague = standings?.[0]?.league;
  const leagueWithHref = primaryLeague
    ? {
        ...primaryLeague,
        href: generateLeagueSlug(primaryLeague.name, primaryLeague.id),
      }
    : null;

  return (
    // The component is now just a simple container for the stack of widgets
    <div className="space-y-8">
      <TeamHeader team={team} countryFlag={fixtures?.[0]?.league?.flag || ""} />

      {/* We no longer render tabs. We render all the widgets directly. */}

      <TeamFixturesWidget fixtures={fixtures} />

      {primaryLeague && leagueWithHref && (
        <LeagueStandingsWidget
          standings={standings[0].league.standings}
          league={leagueWithHref}
        />
      )}

      <TeamSquadWidget squad={squad} />
    </div>
  );
}
