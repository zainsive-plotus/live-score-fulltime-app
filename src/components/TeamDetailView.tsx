import TeamHeader from "./team/TeamHeader";
import TeamSquadWidget from "./team/TeamSquadWidget";
import TeamFixturesWidget from "./team/TeamFixturesWidget";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { getI18n } from "@/lib/i18n/server"; // <-- Import server helper

export default async function TeamDetailView({ teamData }: { teamData: any }) {
  const t = await getI18n(); // <-- Use server helper
  const { teamInfo, squad, fixtures, standings } = teamData;
  const { team } = teamInfo;

  const primaryLeague = standings?.[0]?.league;
  const leagueWithHref = primaryLeague
    ? {
        ...primaryLeague,
        href: generateLeagueSlug(primaryLeague.name, primaryLeague.id),
      }
    : null;

  return (
    <div className="space-y-8">
      {/* Pass translated strings as props */}
      <TeamHeader
        team={team}
        countryFlag={fixtures?.[0]?.league?.flag || ""}
        foundedText={t("founded_in", { year: team.founded })}
      />

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
