"use client";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import { Trophy } from 'lucide-react';

const fetchTopScorers = async (leagueId: number, season: number) => {
    const { data } = await axios.get(`/api/top-scorers?league=${leagueId}&season=${season}`);
    return data;
};

const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-2 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-600/50"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-600/50 rounded"></div>
            <div className="h-3 w-1/2 bg-gray-600/50 rounded"></div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-600/50"></div>
    </div>
);

export default function LeagueTopScorersWidget({ leagueId, season }: { leagueId: number, season: number }) {
    const { data: topScorers, isLoading } = useQuery({
        queryKey: ['topScorers', leagueId, season],
        queryFn: () => fetchTopScorers(leagueId, season),
    });

     if (isLoading) return (
        <div className="bg-brand-secondary rounded-xl p-4">
            <h3 className="text-xl font-bold text-white mb-4">Golden Boot Race</h3>
            <div className="space-y-3">{Array.from({length: 3}).map((_, i) => <SkeletonRow key={i} />)}</div>
        </div>
    );
    
    if (!topScorers || topScorers.length === 0) {
        return null;
    }

    return (
        <div className="bg-brand-secondary rounded-xl p-4">
            <h3 className="text-xl font-bold text-white mb-4">Golden Boot Race</h3>
            <div className="space-y-3">
                {topScorers.slice(0, 5).map((scorer: any, index: number) => (
                    <div key={scorer.player.id} className="flex items-center gap-4">
                        <Image src={scorer.player.photo} alt={scorer.player.name} width={40} height={40} className="rounded-full bg-gray-800" />
                        <div className="flex-1">
                            <p className="font-bold text-white">{scorer.player.name}</p>
                            <p className="text-xs text-brand-muted">{scorer.statistics[0].team.name}</p>
                        </div>
                        <div className={`flex items-center justify-center gap-2 font-bold text-lg p-2 rounded-lg ${index === 0 ? 'text-yellow-300 bg-yellow-500/10' : 'text-white'}`}>
                            <Trophy size={16} />
                            <span>{scorer.statistics[0].goals.total}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}