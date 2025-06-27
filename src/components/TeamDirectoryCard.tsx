// src/components/TeamDirectoryCard.tsx
import Image from "next/image";
import StyledLink from "./StyledLink";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { proxyImageUrl } from "@/lib/image-proxy"; // <-- IMPORT

interface TeamDirectoryCardProps {
  team: { id: number; name: string; logo: string };
  venue: { name: string; city: string };
}

export const TeamDirectoryCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 flex items-center gap-4 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
    <div className="space-y-2 flex-1">
      <div className="h-4 w-3/4 rounded bg-gray-600"></div>
      <div className="h-3 w-1/2 rounded bg-gray-600"></div>
    </div>
  </div>
);

export default function TeamDirectoryCard({
  team,
  venue,
}: TeamDirectoryCardProps) {
  const href = generateTeamSlug(team.name, team.id);

  return (
    <StyledLink href={href} className="block group">
      <div className="bg-brand-secondary rounded-lg p-4 flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20">
        <Image
          // --- APPLY PROXY ---
          src={proxyImageUrl(team.logo)}
          alt={`${team.name} logo`}
          width={40}
          height={40}
          className="flex-shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-bold text-white truncate group-hover:text-brand-purple transition-colors">
            {team.name}
          </h3>
          <p className="text-sm text-brand-muted">{venue?.city || "Unknown"}</p>
        </div>
      </div>
    </StyledLink>
  );
}
