// ===== src/components/directory/LeagueStandingCard.tsx =====

"use client";

import Image from "next/image";
import StyledLink from "@/components/StyledLink";
import { proxyImageUrl } from "@/lib/image-proxy";

interface LeagueStandingCardProps {
  name: string;
  logoUrl: string;
  countryName: string;
  href: string;
}

export const LeagueStandingCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 flex items-center gap-4 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
    <div className="space-y-2 flex-1">
      <div className="h-4 w-3/4 rounded bg-gray-600"></div>
      <div className="h-3 w-1/2 rounded bg-gray-600"></div>
    </div>
  </div>
);

export default function LeagueStandingCard({
  name,
  logoUrl,
  countryName,
  href,
}: LeagueStandingCardProps) {
  return (
    <StyledLink href={href} className="block group h-full">
      <div
        className="bg-brand-secondary rounded-lg flex items-center gap-4 p-4 h-full 
                   transition-all duration-300 transform 
                   hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20 
                   border border-transparent hover:border-brand-purple/30"
      >
        <Image
          src={proxyImageUrl(logoUrl)}
          alt={`${name} logo`}
          width={40}
          height={40}
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate group-hover:text-brand-purple transition-colors">
            {name}
          </h3>
          <p className="text-sm text-brand-muted">{countryName}</p>
        </div>
      </div>
    </StyledLink>
  );
}
