// src/app/football/teams/[countryName]/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";
import StyledLink from "@/components/StyledLink";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { Calendar, Info, MapPin, Search } from "lucide-react";

const ITEMS_PER_PAGE = 18;

// --- TYPE DEFINITION for the API response object ---
interface TeamsByCountryResponse {
  teams: any[];
  count: number;
}

// --- DATA FETCHER ---
const fetchTeamsByCountry = async (
  countryName: string
): Promise<TeamsByCountryResponse> => {
  const { data } = await axios.get(
    `/api/teams-by-country?country=${encodeURIComponent(countryName)}`
  );
  return data;
};

// EnhancedTeamCard and TeamCardSkeleton components remain the same
const EnhancedTeamCard = ({ team, venue }: { team: any; venue: any }) => (
  <StyledLink
    href={generateTeamSlug(team.name, team.id)}
    className="block group h-full"
  >
    <div className="bg-brand-secondary rounded-lg flex flex-col h-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20">
      <div className="p-4 flex items-center gap-4">
        <Image
          src={proxyImageUrl(team.logo)}
          alt={team.name}
          width={48}
          height={48}
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate group-hover:text-brand-purple transition-colors">
            {team.name}
          </h3>
        </div>
      </div>
      <div className="px-4 pb-3 mt-auto border-t border-gray-700/50 pt-3 space-y-1.5 text-xs text-brand-muted">
        {team.founded && (
          <div className="flex items-center gap-2">
            <Calendar size={12} />
            <span>Founded: {team.founded}</span>
          </div>
        )}
        {venue?.name && (
          <div className="flex items-center gap-2 truncate">
            <MapPin size={12} />
            <span className="truncate" title={venue.name}>
              {venue.name}
            </span>
          </div>
        )}
      </div>
    </div>
  </StyledLink>
);

const TeamCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 h-36 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-700"></div>
      <div className="h-5 w-3/4 bg-gray-600 rounded"></div>
    </div>
    <div className="mt-6 space-y-2 border-t border-gray-700/50 pt-3">
      <div className="h-3 w-1/2 bg-gray-600/50 rounded"></div>
      <div className="h-3 w-full bg-gray-600/50 rounded"></div>
    </div>
  </div>
);

export default function TeamsByCountryPage() {
  const params = useParams();
  const countryName = decodeURIComponent(params.countryName as string);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- FIX 1: Rename `data: teams` to `data: response` for clarity ---
  const { data: response, isLoading } = useQuery({
    queryKey: ["teamsByCountry", countryName],
    queryFn: () => fetchTeamsByCountry(countryName),
    staleTime: 1000 * 60 * 60,
  });

  const { paginatedData, totalPages } = useMemo(() => {
    // --- FIX 2: Access the `teams` array *from* the response object ---
    const teamsArray = response?.teams || []; // Use the actual array, or an empty one if data is not ready
    if (teamsArray.length === 0) return { paginatedData: [], totalPages: 0 };

    // --- FIX 3: Filter the `teamsArray`, not the response object ---
    const filtered = teamsArray.filter((teamData) =>
      teamData.team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return { paginatedData, totalPages };
  }, [response, searchTerm, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <h1 className="text-4xl font-extrabold text-white mb-6">
            Teams in {countryName}
          </h1>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by team name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-3 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TeamCardSkeleton key={i} />
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((teamData) => (
                <EnhancedTeamCard
                  key={teamData.team.id}
                  team={teamData.team}
                  venue={teamData.venue}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-brand-secondary rounded-lg">
                <Info size={32} className="mx-auto text-brand-muted mb-3" />
                <p className="text-xl font-bold text-white">No Results Found</p>
                <p className="text-brand-muted mt-2">
                  Try adjusting your search term or check back later.
                </p>
              </div>
            )}
          </div>

          {!isLoading && paginatedData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
