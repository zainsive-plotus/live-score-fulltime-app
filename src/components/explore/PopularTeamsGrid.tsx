"use client";

import { useQuery } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import StyledLink from '../StyledLink';
import Image from 'next/image';
import slugify from 'slugify';

interface TeamData { team: { id: number; name: string; logo: string; } }
interface ApiResponse { response: TeamData[] }

// A curated list of globally popular team IDs.
const POPULAR_TEAM_IDS = [
    33,  // Manchester United
    40,  // Liverpool
    42,  // Arsenal
    47,  // Tottenham
    50,  // Manchester City
    529, // Barcelona
    541, // Real Madrid
    157, // Bayern Munich
    496, // Inter Milan
    489, // AC Milan
];

const generateTeamSlug = (name: string, id: number) => {
    const slug = slugify(name, { lower: true, strict: true });
    return `/team/${slug}-${id}`;
};

// --- THIS IS THE CORRECTED FETCHER ---
const fetchPopularTeams = async (): Promise<TeamData[]> => {
    // 1. Create an array of Axios request promises, one for each ID.
    const teamPromises = POPULAR_TEAM_IDS.map(id =>
        axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams?id=${id}`, {
            headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY }
        })
    );

    // 2. Execute all promises in parallel and wait for them all to complete.
    // We use allSettled so that one failed request doesn't ruin the entire batch.
    const results = await Promise.allSettled(teamPromises);

    // 3. Filter out any failed requests and map the successful ones to get the team data.
    const successfulTeams = results
      .filter((result): result is PromiseFulfilledResult<AxiosResponse<ApiResponse>> => 
          result.status === 'fulfilled' && result.value.data.response.length > 0
      )
      .map(result => result.value.data.response[0]); // Extract the single team object from the response array

    return successfulTeams;
};


const SkeletonCard = () => (
    <div className="bg-brand-secondary rounded-lg h-24 animate-pulse"></div>
);

export default function PopularTeamsGrid() {
    const { data: teams, isLoading } = useQuery<TeamData[]>({
        queryKey: ['popularTeamsGrid'],
        queryFn: fetchPopularTeams,
        staleTime: 1000 * 60 * 60 * 24, // Team info is very static, cache for a day
        refetchOnWindowFocus: false,
    });

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Popular Teams</h2>
            </div>
            
            {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {Array.from({ length: POPULAR_TEAM_IDS.length }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : !teams || teams.length === 0 ? (
                 <div className="bg-brand-secondary rounded-lg p-6 text-center text-brand-muted">
                    <p>Could not load popular teams data.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {teams.map(({ team }) => (
                        <StyledLink 
                            key={team.id} 
                            href={generateTeamSlug(team.name, team.id)}
                            className="bg-brand-secondary rounded-lg p-4 flex items-center justify-center h-24 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20"
                            title={team.name}
                        >
                            <Image
                                src={team.logo}
                                alt={team.name}
                                width={64}
                                height={64}
                                className="object-contain max-h-16"
                            />
                        </StyledLink>
                    ))}
                </div>
            )}
        </section>
    );
}