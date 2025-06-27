"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';

// The data fetched now includes the teams object
interface PredictionData {
    teams: {
        home: { id: number; name: string; logo: string; };
        away: { id: number; name: string; logo: string; };
    };
    percent: { home: number; draw: number; away: number };
}

// Fetcher function (no change)
const fetchPrediction = async (fixtureId: number): Promise<PredictionData> => {
    const { data } = await axios.get(`/api/predictions?fixture=${fixtureId}`);
    return data;
};

// Skeleton loader for the new prediction UI
const PredictionSkeleton = () => (
    <div className="pt-4 mt-4 border-t border-gray-700/50 animate-pulse">
        <div className="h-4 w-1/2 mx-auto rounded bg-gray-600/50 mb-4"></div>
        <div className="flex justify-between items-center">
            <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-8 h-8 rounded-full bg-gray-600/50"></div>
                <div className="h-5 w-10 rounded bg-gray-600/50"></div>
            </div>
            <div className="h-5 w-10 rounded bg-gray-600/50"></div>
            <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-8 h-8 rounded-full bg-gray-600/50"></div>
                <div className="h-5 w-10 rounded bg-gray-600/50"></div>
            </div>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-600/50 mt-3"></div>
    </div>
);

export default function PredictionDisplay({ fixtureId }: { fixtureId: number }) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['prediction', fixtureId],
        queryFn: () => fetchPrediction(fixtureId),
        staleTime: 1000 * 60 * 60,
        retry: 1,
    });

    if (isLoading) return <PredictionSkeleton />;
    if (error || !data) return null;

    // Destructure everything from the single `data` object
    const { teams, percent } = data;
    const { home, draw, away } = percent;

    return (
        <div className="pt-4 mt-4 border-t border-gray-700/50 space-y-3">
            <h4 className="text-sm font-semibold text-center text-brand-muted tracking-wider">PREDICTION</h4>
            <div className="flex justify-between items-center text-white">
                <div className="flex flex-col items-center gap-2 w-1/4">
                    {/* Use the logo from the fetched prediction data */}
                    <Image src={teams.home.logo} alt={teams.home.name} width={32} height={32} className="object-contain"/>
                    <span className="font-bold text-lg">{home}%</span>
                </div>
                <div className="flex flex-col items-center gap-2 opacity-80">
                    <span className="text-xs text-brand-muted">DRAW</span>
                    <span className="font-bold text-lg">{draw}%</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-1/4">
                    {/* Use the logo from the fetched prediction data */}
                    <Image src={teams.away.logo} alt={teams.away.name} width={32} height={32} className="object-contain"/>
                    <span className="font-bold text-lg">{away}%</span>
                </div>
            </div>
            <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-800">
                <div className="bg-[#6D28D9] transition-all duration-500" style={{ width: `${home}%` }}></div>
                <div className="bg-gray-500 transition-all duration-500" style={{ width: `${draw}%` }}></div>
                <div className="bg-blue-600 transition-all duration-500" style={{ width: `${away}%` }}></div>
            </div>
        </div>
    );
}