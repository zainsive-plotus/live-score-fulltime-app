// src/app/football/teams/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import StyledLink from "@/components/StyledLink";
import { ChevronRight, Globe, Search, Users } from "lucide-react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";

export const dynamic = "force-dynamic";

// --- TYPE DEFINITION ---
interface EnrichedCountry {
  name: string;
  code: string | null;
  flagUrl: string;
  leagueCount: number;
}

// --- CARD AND SKELETON COMPONENTS (Unchanged) ---
const EnhancedCountryCard = ({ country }: { country: EnrichedCountry }) => (
  <StyledLink
    href={`/football/teams/${country.name}`}
    className="block group h-full"
  >
    <div className="bg-brand-secondary rounded-lg flex flex-col h-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20">
      <div className="p-4 flex items-center gap-4">
        <Image
          src={country.flagUrl}
          alt={country.name}
          width={40}
          height={40}
          className="rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate group-hover:text-brand-purple transition-colors">
            {country.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-1">
            <Globe size={12} />
            <span>View Teams</span>
          </div>
        </div>
        <ChevronRight className="text-brand-muted group-hover:text-brand-purple transition-colors flex-shrink-0" />
      </div>
      <div className="mt-auto border-t border-gray-700/50 p-3 text-xs text-brand-light flex items-center justify-center gap-2">
        <Users size={14} className="text-brand-muted" />
        <span className="font-semibold">{country.leagueCount}</span>
        <span>Professional Leagues</span>
      </div>
    </div>
  </StyledLink>
);

const CountryCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg flex flex-col h-full animate-pulse">
    <div className="p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gray-700"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 w-3/4 rounded bg-gray-600"></div>
        <div className="h-3 w-1/2 rounded bg-gray-600/50"></div>
      </div>
    </div>
    <div className="mt-auto border-t border-gray-700/50 p-3 flex items-center justify-center gap-2">
      <div className="h-4 w-2/3 bg-gray-700 rounded-md"></div>
    </div>
  </div>
);

export default function BrowseTeamsByCountryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // --- THIS IS THE FIX ---
  // Removed the external fetcher function and defined the query function directly and simply.
  // This is the most reliable pattern and avoids potential stale closure issues.
  const { data: countries, isLoading } = useQuery<EnrichedCountry[]>({
    queryKey: ["countryDirectory"],
    queryFn: async () => {
      const { data } = await axios.get("/api/directory/countries");
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for a day
  });

  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    return countries.filter((country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [countries, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Browse Teams by Country
          </h1>
          <p className="text-brand-muted mb-8">
            Select a country to view all associated professional teams.
          </p>

          <div className="relative mb-8 max-w-lg">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
              size={20}
            />
            <input
              type="text"
              placeholder="Search for a country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-3 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 18 }).map((_, i) => (
                <CountryCardSkeleton key={i} />
              ))
            ) : filteredCountries && filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <EnhancedCountryCard
                  key={country.code || country.name}
                  country={country}
                />
              ))
            ) : (
              <div className="text-center py-20 bg-brand-secondary rounded-lg col-span-full">
                <p className="text-xl font-bold text-white">
                  No Countries Found
                </p>
                <p className="text-brand-muted mt-2">
                  We couldn't find any countries with active leagues. Please
                  check back later.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
