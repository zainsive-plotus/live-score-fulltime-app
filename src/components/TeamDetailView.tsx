// src/components/TeamDetailView.tsx
"use client";

import { useState } from "react";
import AdSlotWidget from "./AdSlotWidget";

// Component Imports
import TeamHeader from "./team/TeamHeader";
import TeamInfoWidget from "./team/TeamInfoWidget";
import TeamTrophiesWidget from "./team/TeamTrophiesWidget";
import TeamSquadTab from "./team/TeamSquadTab";
// --- IMPORT THE NEW, CORRECT WIDGET ---
import TeamFixturesWidget from "./team/TeamFixturesWidget";

const TABS = ["Squad", "Fixtures", "Standings"];

export default function TeamDetailView({ teamData }: { teamData: any }) {
  const [activeTab, setActiveTab] = useState(TABS[1]); // Default to Fixtures tab

  // Destructure the data passed from the server-side page
  const { teamInfo, squad, fixtures } = teamData;
  const { team, venue } = teamInfo;

  return (
    <div>
      <TeamHeader team={team} countryFlag={fixtures?.[0]?.league?.flag || ""} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-brand-purple text-white"
                    : "text-brand-muted hover:bg-gray-700/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div>
            {activeTab === "Squad" && <TeamSquadTab squad={squad} />}

            {/* --- THIS IS THE FIX --- */}
            {/* Replace the old widget with the new one, passing the pre-fetched fixtures data */}
            {activeTab === "Fixtures" && (
              <TeamFixturesWidget fixtures={fixtures} />
            )}

            {activeTab === "Standings" && (
              <div className="bg-brand-secondary p-8 rounded-lg text-center">
                <p>Team Standings Tab - Coming Soon!</p>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <TeamInfoWidget venue={venue} />
          <TeamTrophiesWidget teamId={team.id} />
          <AdSlotWidget />
        </aside>
      </div>
    </div>
  );
}
