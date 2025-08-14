// ===== src/components/HeaderSearchModal.tsx =====

"use client";

import { useState, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search, Loader2, Trophy, Users, X, ChevronDown } from "lucide-react";
import { Transition, Popover } from "@headlessui/react";
import Image from "next/image";

import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "./StyledLink";
import { proxyImageUrl } from "@/lib/image-proxy";

interface SearchResult {
  teams: any[];
  leagues: any[];
}
type SearchCategory = "all" | "league" | "team";

// Placeholder data for the "Most Popular Searches" section
const POPULAR_SEARCHES = [
  {
    id: 39,
    name: "Premier League",
    meta: "LEAGUE, ENGLAND",
    logo: "https://media-4.api-sports.io/football/leagues/39.png",
    href: "/football/league/premier-league-39",
  },
  {
    id: 2,
    name: "UEFA Champions League",
    meta: "LEAGUE, WORLD",
    logo: "https://media-4.api-sports.io/football/leagues/2.png",
    href: "/football/league/uefa-champions-league-2",
  },
  {
    id: 33,
    name: "Manchester United",
    meta: "TEAM, ENGLAND",
    logo: "https://media-4.api-sports.io/football/teams/33.png",
    href: "/football/team/manchester-united-33",
  },
  {
    id: 140,
    name: "La Liga",
    meta: "LEAGUE, SPAIN",
    logo: "https://media-4.api-sports.io/football/leagues/140.png",
    href: "/football/league/la-liga-140",
  },
  {
    id: 529,
    name: "Barcelona",
    meta: "TEAM, SPAIN",
    logo: "https://media-4.api-sports.io/football/teams/529.png",
    href: "/football/team/barcelona-529",
  },
];

const fetchSearchResults = async (query: string): Promise<SearchResult> => {
  const { data } = await axios.get(`/api/search/global?q=${query}`);
  return data;
};

const SearchResultItem = ({
  href,
  logo,
  name,
  meta,
  onClose,
}: {
  href: string;
  logo: string;
  name: string;
  meta: string;
  onClose: () => void;
}) => (
  <StyledLink
    href={href}
    onClick={onClose}
    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
  >
    <Image
      src={proxyImageUrl(logo)}
      alt={name}
      width={32}
      height={32}
      className="bg-white/10 rounded-full p-0.5"
    />
    <div>
      <p className="font-semibold text-white text-sm">{name}</p>
      <p className="text-xs text-text-muted">{meta}</p>
    </div>
  </StyledLink>
);

const SearchResultSkeleton = () => (
  <div className="flex items-center gap-3 p-2.5 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
    <div className="flex-1 space-y-1.5">
      <div className="h-4 w-3/4 bg-gray-600 rounded"></div>
      <div className="h-3 w-1/2 bg-gray-600 rounded"></div>
    </div>
  </div>
);

export default function HeaderSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["globalSearch", debouncedQuery],
    queryFn: () => fetchSearchResults(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    staleTime: 1000 * 60 * 5,
  });

  // Effect to lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Cleanup function to reset scroll on component unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setCategory("all");
    }
  }, [isOpen]);

  const filteredData = {
    leagues:
      category === "all" || category === "league" ? data?.leagues || [] : [],
    teams: category === "all" || category === "team" ? data?.teams || [] : [],
  };

  const hasResults =
    filteredData.teams.length > 0 || filteredData.leagues.length > 0;

  const categoryOptions: { key: SearchCategory; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "league", label: t("leagues") },
    { key: "team", label: t("teams") },
  ];

  return (
    <Transition show={isOpen} as={Fragment}>
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-24 p-4">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="bg-brand-secondary rounded-xl shadow-2xl border border-gray-700 flex flex-col w-full max-w-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3 pl-4 border-b border-gray-700/50">
              <h2 className="text-lg font-bold text-white">{t("search")}</h2>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-white rounded-full hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Input Section */}
            <div className="flex items-center gap-2 p-3">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={18}
                />
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search_type_here")}
                  className="w-full bg-brand-dark border border-gray-600 rounded-md py-2 pl-11 pr-4 text-base text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                />
              </div>

              <Popover className="relative">
                <Popover.Button className="flex items-center gap-2 w-32 justify-between px-3 py-2 bg-brand-dark border border-gray-600 rounded-md text-white text-sm font-semibold">
                  <span>
                    {categoryOptions.find((c) => c.key === category)?.label}
                  </span>
                  <ChevronDown size={16} />
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Popover.Panel className="absolute right-0 mt-1 w-36 origin-top-right rounded-md bg-brand-dark shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="p-1">
                      {categoryOptions.map((opt) => (
                        <Popover.Button
                          as="button"
                          key={opt.key}
                          onClick={() => setCategory(opt.key)}
                          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-brand-secondary"
                        >
                          {opt.label}
                        </Popover.Button>
                      ))}
                    </div>
                  </Popover.Panel>
                </Transition>
              </Popover>
            </div>

            {/* Results Section */}
            <div className="max-h-[50vh] min-h-[18rem] overflow-y-auto custom-scrollbar p-2">
              {debouncedQuery.length < 3 && (
                <div className="p-4">
                  <h3 className="text-xs font-bold uppercase text-text-muted px-2 py-2">
                    {t("most_popular_searches")}
                  </h3>
                  {POPULAR_SEARCHES.map((item) => (
                    <SearchResultItem
                      key={item.id}
                      {...item}
                      meta={item.meta}
                      onClose={onClose}
                    />
                  ))}
                </div>
              )}
              {debouncedQuery.length >= 3 && isLoading && (
                <div className="p-2 space-y-1">
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                </div>
              )}
              {debouncedQuery.length >= 3 && !isLoading && !hasResults && (
                <div className="p-10 text-center text-text-muted text-sm">
                  <p>
                    {t("no_search_results_subtitle", {
                      searchTerm: debouncedQuery,
                    })}
                  </p>
                </div>
              )}
              {debouncedQuery.length >= 3 && hasResults && (
                <div className="space-y-2">
                  {filteredData.leagues.length > 0 && (
                    <section>
                      <h3 className="text-xs font-bold uppercase text-text-muted px-2 py-2 flex items-center gap-2">
                        <Trophy size={14} /> {t("leagues")}
                      </h3>
                      {filteredData.leagues.map((league) => (
                        <SearchResultItem
                          key={`l-${league.id}`}
                          {...league}
                          meta={league.country}
                          onClose={onClose}
                        />
                      ))}
                    </section>
                  )}
                  {filteredData.teams.length > 0 && (
                    <section>
                      <h3 className="text-xs font-bold uppercase text-text-muted px-2 py-2 flex items-center gap-2">
                        <Users size={14} /> {t("teams")}
                      </h3>
                      {filteredData.teams.map((team) => (
                        <SearchResultItem
                          key={`t-${team.id}`}
                          {...team}
                          meta={team.country}
                          onClose={onClose}
                        />
                      ))}
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
}
