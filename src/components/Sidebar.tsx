"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { usePathname } from "next/navigation";
import { useLeagueContext } from "@/context/LeagueContext";
import { League } from "@/types/api-football";
import { useTranslation } from "@/hooks/useTranslation";
import slugify from "slugify";
import PopularTeamsList from "./PopularTeamsList";
import AdSlotWidget from "./AdSlotWidget";
import CasinoPartnerWidget from "./CasinoPartnerWidget";

// --- (All helper functions and sub-components like LeagueList, LeagueItemSkeleton remain the same) ---
const generateLeagueSlug = (name: string, id: number) => {
  const slug = slugify(name, { lower: true, strict: true });
  return `/football/league/${slug}-${id}`;
};

const fetchLeagues = async (countryName: string | null): Promise<League[]> => {
  const endpoint = countryName
    ? `/api/leagues?type=league&country=${encodeURIComponent(countryName)}`
    : `/api/leagues?type=league`;
  const { data } = await axios.get(endpoint);
  return data.map((item: any) => ({
    ...item,
    href: generateLeagueSlug(item.name, item.id),
  }));
};

const LeagueList = ({ leagues }: { leagues: League[] }) => {
  const pathname = usePathname();
  if (!leagues || leagues.length === 0) {
    return (
      <p className="text-text-muted text-xs p-2.5">No competitions found.</p>
    );
  }
  return (
    <ul className="space-y-1">
      {leagues.map((league) => {
        const isActive = pathname.startsWith(league.href);
        return (
          <li key={league.id}>
            <Link
              href={league.href}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-brand-purple shadow-md text-white"
                  : "hover:bg-gray-700/50 text-text-primary"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Image
                  src={league.logoUrl}
                  alt={`${league.name} logo`}
                  width={24}
                  height={24}
                  className="flex-shrink-0"
                />
                <span
                  className={`font-bold text-sm truncate ${
                    isActive ? "text-white" : "text-text-primary"
                  }`}
                >
                  {league.name}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

const LeagueItemSkeleton = () => (
  <div className="flex items-center justify-between p-2.5 rounded-lg animate-pulse">
    <div className="flex items-center gap-3 w-3/4">
      <div className="h-6 w-6 rounded-full bg-gray-600/50"></div>
      <div className="h-4 w-full rounded bg-gray-600/50"></div>
    </div>
  </div>
);

// --- Main Sidebar Component ---
export default function Sidebar() {
  const { t } = useTranslation();
  const { selectedCountry } = useLeagueContext();

  const { data: leagues, isLoading: isLoadingLeagues } = useQuery<League[]>({
    queryKey: ["leagues", selectedCountry?.name || "global"],
    queryFn: () => fetchLeagues(selectedCountry?.name || null),
  });

  return (
    // --- The outer <aside> is NO LONGER sticky. It's just a simple container. ---
    <aside className="hidden lg:block">
      {/* --- NEW STICKY CONTAINER --- */}
      {/* We use another div inside to manage the gap between sticky items. */}
      <div className="flex flex-col gap-4 h-auto">
        <CasinoPartnerWidget />

        {/* --- WIDGET 1: Popular Leagues (This part will scroll normally) --- */}
        <section
          className="flex flex-col gap-2 p-3 rounded-xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted px-2">
            {selectedCountry
              ? `Leagues in ${selectedCountry.name}`
              : t("popular_leagues")}
          </h2>
          {isLoadingLeagues ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <LeagueItemSkeleton key={i} />
              ))}
            </div>
          ) : (
            <LeagueList leagues={leagues!} />
          )}
        </section>

        {/* --- AD SLOT WIDGET (Now Sticky) --- */}
        <AdSlotWidget location="homepage_left_sidebar" />

        {/* --- WIDGET 2: Popular Teams (Now Sticky) --- */}
        <section
          className="flex flex-col gap-2 p-3 rounded-xl sticky top-8"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted px-2">
            {t("popular_teams")}
          </h2>
          <PopularTeamsList />
        </section>
      </div>
    </aside>
  );
}
