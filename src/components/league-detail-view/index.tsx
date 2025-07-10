import Image from "next/image";
import { Shield, Users, Trophy, Flag } from "lucide-react";
import LeagueStatCard from "./LeagueStatCard";
import LeagueFixturesWidget from "./LeagueFixturesWidget";
import LeagueStandingsWidget from "./LeagueStandingsWidget";
import LeagueTopScorersWidget from "./LeagueTopScorersWidget";
import LeagueTeamsList from "./LeagueTeamsList";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateLeagueSlug } from "@/lib/generate-league-slug"; // Import slug generator

export default function LeagueDetailView({ leagueData }: { leagueData: any }) {
  const { league, country, seasons } = leagueData;
  const currentSeason =
    seasons.find((s: any) => s.current === true)?.year ||
    new Date().getFullYear();

  // Add href to the league object for the standings widget link
  const leagueWithHref = {
    ...league,
    href: generateLeagueSlug(league.name, league.id),
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. HERO HEADER (Unchanged) */}
      <div className="flex flex-col items-center text-center gap-4 p-4 bg-brand-secondary rounded-xl">
        <Image
          src={proxyImageUrl(league.logo)}
          alt={league.name}
          width={80}
          height={80}
          className="bg-white rounded-full p-2"
        />
        <h1 className="text-4xl font-extrabold text-white">{league.name}</h1>
        <div className="flex items-center gap-2 text-brand-muted">
          {country.flag && (
            <Image
              src={proxyImageUrl(country.flag)}
              alt={country.name}
              width={20}
              height={20}
            />
          )}
          <span>{country.name}</span>
        </div>
      </div>

      {/* 2. "AT A GLANCE" STAT CARDS (Unchanged) */}
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
          value={league.standings?.[0]?.length || "N/A"}
        />
      </div>

      {/* 3. FIXTURES WIDGET (Primary Content) */}
      <LeagueFixturesWidget leagueId={league.id} season={currentSeason} />

      {/* --- THIS IS THE NEW 2-COLUMN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Standings */}
        {league.type === "League" && (
          <LeagueStandingsWidget
            standings={league.standings}
            league={leagueWithHref}
          />
        )}

        {/* Right Column: Top Scorers */}
        <LeagueTopScorersWidget leagueId={league.id} season={currentSeason} />
      </div>

      {/* 5. FULL TEAMS LIST (remains at the bottom) */}
      <LeagueTeamsList
        leagueId={league.id}
        season={currentSeason}
        countryName={country.name}
        countryFlag={country.flag}
      />
    </div>
  );
}
