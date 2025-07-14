"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "@/components/StyledLink";
import { usePathname } from "next/navigation";
import Image from "next/image";
import slugify from "slugify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";

interface TeamData {
  team: { id: number; name: string; logo: string };
  venue: any;
}

const generateTeamSlug = (name: string, id: number) => {
  const slug = slugify(name, { lower: true, strict: true });
  return `/football/team/${slug}-${id}`;
};

const fetchPopularTeams = async (): Promise<TeamData[]> => {
  const POPULAR_LEAGUE_ID = 39; // Premier League
  const season = new Date().getFullYear();
  const { data } = await axios.get(
    `/api/teams?league=${POPULAR_LEAGUE_ID}&season=${season}`
  );
  return data;
};

const TeamItemSkeleton = () => (
  <div className="flex items-center p-2.5 rounded-lg animate-pulse">
    <div className="flex items-center gap-3 w-full">
      <div className="h-6 w-6 rounded-full bg-gray-600/50"></div>
      <div className="h-4 w-4/5 rounded bg-gray-600/50"></div>
    </div>
  </div>
);

export default function PopularTeamsList() {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const { t } = useTranslation();

  const {
    data: allTeams,
    isLoading,
    isError,
  } = useQuery<TeamData[]>({
    queryKey: ["popularTeams"],
    queryFn: fetchPopularTeams,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
  });

  const totalPages = allTeams ? Math.ceil(allTeams.length / ITEMS_PER_PAGE) : 0;

  const paginatedTeams = useMemo(() => {
    if (!allTeams) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allTeams.slice(startIndex, endIndex);
  }, [allTeams, currentPage]);

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <TeamItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !paginatedTeams || paginatedTeams.length === 0) {
    return (
      <p className="text-brand-muted text-xs p-2.5">
        {t("error_loading_teams")}
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-1">
        {paginatedTeams.map(({ team }) => {
          const href = generateTeamSlug(team.name, team.id);
          const isActive = pathname.startsWith(href);
          return (
            <li key={team.id}>
              <Link
                href={href}
                className={`w-full flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-brand-purple shadow-md text-white"
                    : "hover:bg-gray-700/50 text-brand-light"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Image
                    src={proxyImageUrl(team.logo)}
                    alt={`${team.name} logo`}
                    width={24}
                    height={24}
                    className="flex-shrink-0"
                  />
                  <span
                    className={`font-bold text-sm truncate ${
                      isActive ? "text-white" : "text-brand-light"
                    }`}
                  >
                    {team.name}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50"
            aria-label={t("previous_page")}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-semibold text-brand-muted">
            {t("page_of", { currentPage, totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50"
            aria-label={t("next_page")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
