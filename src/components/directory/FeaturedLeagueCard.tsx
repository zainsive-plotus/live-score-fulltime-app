"use client";

import Image from "next/image";
import StyledLink from "@/components/StyledLink";
import { proxyImageUrl } from "@/lib/image-proxy"; // Make sure proxy is imported
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface FeaturedLeagueCardProps {
  name: string;
  logoUrl: string;
  countryName: string;
  href: string;
}

export const FeaturedLeagueCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-6 space-y-4 animate-pulse h-48 flex flex-col justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-700"></div>
      <div className="space-y-2 flex-1">
        <div className="h-5 w-3/4 rounded bg-gray-600"></div>
        <div className="h-4 w-1/2 rounded bg-gray-600"></div>
      </div>
    </div>
    <div className="h-10 w-full rounded bg-gray-700 mt-4"></div>
  </div>
);

export default function FeaturedLeagueCard({
  name,
  logoUrl,
  countryName,
  href,
}: FeaturedLeagueCardProps) {
  const { t } = useTranslation();

  return (
    <StyledLink
      href={href}
      className="block group h-full transition-transform duration-300 ease-in-out hover:-translate-y-1"
    >
      <div
        className="bg-brand-secondary rounded-lg h-full p-6 flex flex-col justify-between
                   border border-gray-700/50 relative overflow-hidden
                   hover:border-brand-purple/50 hover:shadow-2xl hover:shadow-brand-purple/20"
      >
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-brand-purple/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative">
          <div className="flex items-center gap-4">
            {/* ** THE FIX IS HERE: Wrap the logoUrl with proxyImageUrl ** */}
            <Image
              src={proxyImageUrl(logoUrl)}
              alt={`${name} logo`}
              width={48}
              height={48}
              className="flex-shrink-0 bg-white p-1 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl text-white truncate">{name}</h3>
              <p className="text-sm text-brand-muted">{countryName}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-6">
          <div
            className="flex items-center justify-center gap-2 w-full bg-[var(--brand-accent)] text-white font-bold py-3 px-4 rounded-lg
                           group-hover:opacity-90 transition-opacity text-sm"
          >
            <span>{t("view_standings")}</span>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </StyledLink>
  );
}
