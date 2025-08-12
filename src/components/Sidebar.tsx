"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { usePathname } from "next/navigation";
import { useLeagueContext } from "@/context/LeagueContext";
import { League } from "@/types/api-football";
import { useTranslation } from "@/hooks/useTranslation";
import PopularTeamsList from "./PopularTeamsList";
import AdSlotWidget from "./AdSlotWidget";
import CasinoPartnerWidget from "./CasinoPartnerWidget";
import { proxyImageUrl } from "@/lib/image-proxy";

// 1. fetchLeagues now accepts a locale
const fetchLeagues = async (
  countryName: string | null,
  locale: string
): Promise<League[]> => {
  // 2. The locale is appended as a query parameter to the API call
  const endpoint = countryName
    ? `/api/leagues?type=league&country=${encodeURIComponent(
        countryName
      )}&locale=${locale}`
    : `/api/leagues?type=league&locale=${locale}`;

  const { data } = await axios.get(endpoint);
  return data;
};

const LeagueList = ({ leagues }: { leagues: League[] }) => {
  const pathname = usePathname();
  const { t } = useTranslation();

  if (!leagues || leagues.length === 0) {
    return (
      <p className="text-text-muted text-xs p-2.5">
        {t("no_competitions_found")}
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {leagues.map((league) => {
        const isActive = pathname === league.href; // Exact match for active state
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
                  src={proxyImageUrl(league.logoUrl)}
                  alt={`${league.name} logo`}
                  width={24}
                  height={24}
                  className="flex-shrink-0"
                  unoptimized={true}
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

export default function Sidebar() {
  const { t, locale } = useTranslation(); // 3. Get the current locale from the hook
  const { selectedCountry } = useLeagueContext();

  const {
    data: leagues,
    isLoading: isLoadingLeagues,
    isError,
  } = useQuery<League[]>({
    // 4. The locale is added to the queryKey to ensure unique caching per language
    queryKey: ["leagues", selectedCountry?.name || "global", locale],
    // 5. The locale is passed to the fetch function
    queryFn: () => fetchLeagues(selectedCountry?.name || null, locale),
  });

  const getSidebarTitle = () => {
    if (selectedCountry) {
      return t("leagues_in_country", { country: selectedCountry.name });
    }
    return t("popular_leagues");
  };

  return (
    <aside className="hidden lg:block">
      <div className="flex flex-col gap-4 h-auto">
        {/* <CasinoPartnerWidget /> */}
        <AdSlotWidget location="homepage_left_sidebar" />
        <section
          className="flex flex-col gap-2 p-3 rounded-xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-bold uppercase tracking-wider text-text-muted px-2">
            {getSidebarTitle()}
          </p>
          {isLoadingLeagues ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <LeagueItemSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <p className="text-red-400 text-xs p-2.5">
              {t("error_loading_leagues")}
            </p>
          ) : (
            <LeagueList leagues={leagues!} />
          )}
        </section>

        <section
          className="flex flex-col gap-2 p-3 rounded-xl sticky top-8"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-bold uppercase tracking-wider text-text-muted px-2">
            {t("popular_teams")}
          </p>
          <PopularTeamsList />
        </section>
      </div>
    </aside>
  );
}
