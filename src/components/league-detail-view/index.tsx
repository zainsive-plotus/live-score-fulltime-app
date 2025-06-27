"use client";

import Image from "next/image";
import { Shield, Users, Trophy, Flag } from "lucide-react";

// Import our NEW, redesigned widget components
import LeagueStatCard from "./LeagueStatCard";
import LeagueFixturesWidget from "./LeagueFixturesWidget";
import LeagueStandingsWidget from "./LeagueStandingsWidget";
import LeagueTopScorersWidget from "./LeagueTopScorersWidget";
import LeagueTeamsList from "./LeagueTeamsList"; // Renamed from LeagueTeamsTab

export default function LeagueDetailView({ leagueData }: { leagueData: any }) {
  const { league, country, seasons } = leagueData;
  const currentSeason =
    seasons.find((s: any) => s.current === true)?.year ||
    new Date().getFullYear();

  return (
    <div className="flex flex-col gap-8">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col items-center text-center gap-4 p-4 bg-brand-secondary rounded-xl">
        <Image
          src={league.logo}
          alt={league.name}
          width={80}
          height={80}
          className="bg-white rounded-full p-2"
        />
        <h1 className="text-4xl font-extrabold text-white">{league.name}</h1>
        <div className="flex items-center gap-2 text-brand-muted">
          <Image src={country.flag} alt={country.name} width={20} height={20} />
          <span>{country.name}</span>
        </div>
      </div>

      {/* 2. "AT A GLANCE" STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LeagueStatCard icon={<Shield />} label="Type" value={league.type} />
        <LeagueStatCard icon={<Flag />} label="Country" value={country.name} />
        <LeagueStatCard
          icon={<Trophy />}
          label="Current Season"
          value={currentSeason}
        />
        <LeagueStatCard
          icon={<Users />}
          label="Teams"
          value={seasons[0]?.coverage?.fixtures?.events ? "20" : "N/A"}
        />
      </div>

      {/* 3. DYNAMIC MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          <LeagueFixturesWidget leagueId={league.id} season={currentSeason} />
        </div>

        {/* Sidebar Widgets Column */}
        <div className="lg:col-span-1 space-y-8">
          {league.type === "League" && (
            <LeagueStandingsWidget
              leagueId={league.id}
              season={currentSeason}
            />
          )}
          <LeagueTopScorersWidget leagueId={league.id} season={currentSeason} />
        </div>
      </div>

      {/* 4. FULL TEAMS LIST */}
      <LeagueTeamsList
        leagueId={league.id}
        season={currentSeason}
        countryName={country.name}
        countryFlag={country.flag}
      />
    </div>
  );
}
