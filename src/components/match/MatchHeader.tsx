// src/components/match/MatchHeader.tsx
import Image from "next/image";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import StyledLink from "@/components/StyledLink";
import { proxyImageUrl } from "@/lib/image-proxy"; // <-- IMPORT

interface MatchHeaderProps {
  fixture: any;
}

export default function MatchHeader({ fixture }: MatchHeaderProps) {
  const { league, teams } = fixture;
  const homeTeam = teams.home;
  const awayTeam = teams.away;

  return (
    <header className="bg-brand-secondary p-4 md:p-6 rounded-t-lg">
      <div className="flex items-center justify-between mb-4">
        <StyledLink
          href={generateLeagueSlug(league.name, league.id)}
          className="flex items-center gap-2 group"
        >
          <Image
            // --- APPLY PROXY ---
            src={proxyImageUrl(league.logo)}
            alt={league.name}
            width={24}
            height={24}
          />
          <span className="text-sm text-brand-light font-semibold group-hover:text-white">
            {league.name}
          </span>
        </StyledLink>
        <span className="text-sm text-brand-muted">{league.round}</span>
      </div>

      <div className="flex items-center justify-center gap-4 md:gap-8 text-white">
        <StyledLink
          href={generateTeamSlug(homeTeam.name, homeTeam.id)}
          className="flex-1 flex flex-col-reverse md:flex-row items-center gap-4 justify-end"
        >
          <h2 className="text-lg md:text-2xl font-bold text-center md:text-right">
            {homeTeam.name}
          </h2>
          <Image
            // --- APPLY PROPY ---
            src={proxyImageUrl(homeTeam.logo)}
            alt={homeTeam.name}
            width={64}
            height={64}
          />
        </StyledLink>

        <div className="text-4xl font-bold">vs</div>

        <StyledLink
          href={generateTeamSlug(awayTeam.name, awayTeam.id)}
          className="flex-1 flex flex-col md:flex-row items-center gap-4"
        >
          <Image
            // --- APPLY PROXY ---
            src={proxyImageUrl(awayTeam.logo)}
            alt={awayTeam.name}
            width={64}
            height={64}
          />
          <h2 className="text-lg md:text-2xl font-bold text-center md:text-left">
            {awayTeam.name}
          </h2>
        </StyledLink>
      </div>
    </header>
  );
}
