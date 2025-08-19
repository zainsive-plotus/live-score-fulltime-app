// ===== src/components/league-detail-view/index.tsx =====

"use client"; // ADD: This component now needs to be a client component to use hooks

import Image from "next/image";
import { Shield, Users, Trophy, Flag, ArrowLeft } from "lucide-react"; // ADD: Import ArrowLeft
import LeagueStatCard from "./LeagueStatCard";
import LeagueFixturesWidget from "./LeagueFixturesWidget";
import LeagueStandingsWidget from "./LeagueStandingsWidget";
import LeagueTopScorersWidget from "./LeagueTopScorersWidget";
import LeagueTeamsList from "./LeagueTeamsList";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { useLeagueContext } from "@/context/LeagueContext"; // ADD: Import the context
import { useTranslation } from "@/hooks/useTranslation"; // ADD: Import translation hook

export default function LeagueDetailView({ leagueData }: { leagueData: any }) {
  const { setSelectedLeague } = useLeagueContext(); // ADD: Get the setter from context
  const { t } = useTranslation(); // ADD: Get the translation function

  const isFromSidebar = !!leagueData.logoUrl;

  const league = isFromSidebar
    ? {
        id: leagueData.id,
        name: leagueData.name,
        logo: leagueData.logoUrl,
        type: leagueData.type,
      }
    : leagueData.league;

  const country = isFromSidebar
    ? {
        name: leagueData.countryName,
        flag: leagueData.countryFlagUrl,
      }
    : leagueData.country;

  const seasons = leagueData.seasons || [];
  const standings = leagueData.standings || [];

  const currentSeason =
    seasons?.find((s: any) => s.current === true)?.year ||
    new Date().getFullYear();

  const leagueWithHref = {
    ...league,
    href: generateLeagueSlug(league.name, league.id),
  };

  const hasFullData = seasons && seasons.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* ADD: Back to Match List Button */}
      <button
        onClick={() => setSelectedLeague(null)}
        className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-white transition-colors self-start"
      >
        <ArrowLeft size={16} />
        {t("back_to_match_list")}
      </button>

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
          {country?.flag && (
            <Image
              src={proxyImageUrl(country.flag)}
              alt={country.name}
              width={20}
              height={20}
            />
          )}
          <span>{country?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LeagueStatCard icon={<Shield />} label="Type" value={league.type} />
        <LeagueStatCard icon={<Flag />} label="Country" value={country?.name} />
        <LeagueStatCard
          icon={<Trophy />}
          label="Current Season"
          value={currentSeason}
        />
        <LeagueStatCard
          icon={<Users />}
          label="Teams"
          value={standings?.[0]?.length || "N/A"}
        />
      </div>

      <LeagueFixturesWidget leagueId={league.id} season={currentSeason} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {league.type === "League" && standings.length > 0 && (
          <LeagueStandingsWidget
            initialStandings={standings}
            leagueSeasons={seasons.map((s: any) => s.year)}
            currentSeason={currentSeason}
            isLoading={false}
            leagueId={league.id}
            leagueSlug={leagueWithHref.href.split("/").pop()}
          />
        )}

        {hasFullData && (
          <LeagueTopScorersWidget leagueId={league.id} season={currentSeason} />
        )}
      </div>

      {hasFullData && (
        <LeagueTeamsList
          leagueId={league.id}
          season={currentSeason}
          countryName={country.name}
          countryFlag={country.flag}
        />
      )}
    </div>
  );
}
