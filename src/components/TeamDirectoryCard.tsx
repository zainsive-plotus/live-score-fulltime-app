// src/components/TeamDirectoryCard.tsx
import Image from "next/image";
import Link from "next/link";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { proxyImageUrl } from "@/lib/image-proxy";
import { MapPin, Calendar } from "lucide-react"; // Import new icons

interface TeamDirectoryCardProps {
  team: {
    id: number;
    name: string;
    logo: string;
    country: string;
    founded?: number;
  };
  venue: { name: string; city: string };
}

// --- NEW, ENHANCED SKELETON ---
export const TeamDirectoryCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg flex flex-col h-full animate-pulse">
    {/* Top part */}
    <div className="p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-700"></div>
      <div className="flex-1 space-y-2">
        <div className="h-5 w-full rounded bg-gray-700"></div>
        <div className="h-4 w-1/2 rounded bg-gray-700"></div>
      </div>
    </div>
    {/* Bottom part (for the new details) */}
    <div className="mt-auto border-t border-gray-700/50 p-4 space-y-3">
      <div className="h-3 w-3/4 rounded bg-gray-700"></div>
      <div className="h-3 w-2/3 rounded bg-gray-700"></div>
    </div>
  </div>
);

// --- NEW, ENHANCED CARD ---
export default function TeamDirectoryCard({
  team,
  venue,
}: TeamDirectoryCardProps) {
  const href = generateTeamSlug(team.name, team.id);

  return (
    <Link href={href} className="block group h-full">
      <div className="bg-brand-secondary rounded-lg flex flex-col h-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--brand-accent)]/20">
        {/* --- Top Section: Team Info --- */}
        <div className="p-4 flex items-center gap-4">
          <Image
            src={proxyImageUrl(team.logo)}
            alt={`${team.name} logo`}
            width={48} // Slightly larger logo
            height={48}
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-white truncate group-hover:text-[var(--brand-accent)] transition-colors">
              {team.name}
            </h3>
            <p className="text-sm text-text-muted">{team.country}</p>
          </div>
        </div>

        {/* --- Bottom Section: Details --- */}
        {/* mt-auto pushes this section to the bottom of the card */}
        <div className="mt-auto border-t border-gray-700/50 p-4 space-y-2">
          {team.founded && (
            <div className="flex items-center gap-2.5 text-sm text-text-secondary">
              <Calendar size={14} className="text-text-muted flex-shrink-0" />
              <span className="font-semibold">Founded: {team.founded}</span>
            </div>
          )}
          {venue?.name && (
            <div className="flex items-center gap-2.5 text-sm text-text-secondary">
              <MapPin size={14} className="text-text-muted flex-shrink-0" />
              <span className="font-semibold truncate" title={venue.name}>
                {venue.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
