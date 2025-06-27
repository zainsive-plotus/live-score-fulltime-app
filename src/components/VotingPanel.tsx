"use client";

import { useState, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import { useVoteStorage } from '@/hooks/useVoteStorage'; // Assumes this hook exists

// --- Type Definitions ---
interface VoteData {
    homeVotes: number;
    drawVotes: number;
    awayVotes: number;
}
interface VotingPanelProps {
    fixtureId: number;
    teams: { home: any; away: any; };
}

// --- API Helper Functions ---
const getVotes = async (fixtureId: number): Promise<VoteData> => {
    const { data } = await axios.get(`/api/votes?fixture=${fixtureId}`);
    return data;
};

const submitVote = async ({ fixtureId, vote }: { fixtureId: number; vote: string }): Promise<VoteData> => {
    const { data } = await axios.post('/api/votes', { fixtureId, vote });
    return data;
};

// --- Skeleton Component for Loading State ---
const PanelSkeleton = () => (
    <div className="animate-pulse p-4">
        <div className="h-4 w-1/2 mx-auto rounded bg-gray-600/50 mb-4"></div>
        <div className="grid grid-cols-3 gap-3">
            <div className="h-24 rounded-lg bg-gray-700/50"></div>
            <div className="h-24 rounded-lg bg-gray-700/50"></div>
            <div className="h-24 rounded-lg bg-gray-700/50"></div>
        </div>
    </div>
);

// --- Main VotingPanel Component ---
const VotingPanel = memo(function VotingPanel({ fixtureId, teams }: VotingPanelProps) {
    const queryClient = useQueryClient();
    const { setVote, getVoteForFixture } = useVoteStorage();
    
    // Initialize state by checking if a vote exists in local storage.
    const [hasVoted, setHasVoted] = useState(() => !!getVoteForFixture(fixtureId));

    // Query to fetch live community vote data
    const { data: voteData, isLoading } = useQuery({
        queryKey: ['votes', fixtureId],
        queryFn: () => getVotes(fixtureId),
        staleTime: 1000 * 60, // Refetch data every minute to show new votes
    });

    // Mutation to submit a new vote
    const voteMutation = useMutation({
        mutationFn: submitVote,
        onSuccess: () => {
            // After a successful vote, immediately refetch the vote counts to get the latest data.
            queryClient.invalidateQueries({ queryKey: ['votes', fixtureId] });
        },
    });

    const handleVote = (choice: 'home' | 'draw' | 'away') => {
        if (hasVoted) return; // Prevent re-voting
        
        setVote(fixtureId, choice); // Save to local storage
        setHasVoted(true);          // Update state to show results immediately
        voteMutation.mutate({ fixtureId, vote: choice }); // Send the vote to the backend
    };

    const handleBetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(`User clicked Bet Now for fixture ${fixtureId}`);
        // Example: window.open('https://chinchincasino.com', '_blank');
    };

    if (isLoading) {
        return <PanelSkeleton />;
    }

    if (!voteData) {
        return <p className="text-center text-sm text-brand-muted py-4">Could not load voting data.</p>;
    }

    // Calculate percentages from community votes for the results view
    const totalVotes = voteData.homeVotes + voteData.drawVotes + voteData.awayVotes;
    const homePercent = totalVotes > 0 ? Math.round((voteData.homeVotes / totalVotes) * 100) : 34;
    const awayPercent = totalVotes > 0 ? Math.round((voteData.awayVotes / totalVotes) * 100) : 33;
    const drawPercent = 100 - homePercent - awayPercent;

    return (
        <div className="bg-[#1F1D2B] p-4 border-t-2 border-gray-900/50">
            {!hasVoted ? (
                // --- VOTING VIEW ---
                <>
                    <h4 className="text-center text-sm font-bold text-brand-muted mb-3 tracking-wider">WHO WILL WIN?</h4>
                    <div className="flex justify-center items-stretch gap-3">
                        <button onClick={() => handleVote('home')} className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-800/60 hover:bg-brand-purple transition-all duration-200 transform hover:-translate-y-1">
                            <Image src={teams.home.logo} alt={teams.home.name} width={48} height={48} className="object-contain h-12"/>
                            <span className="text-xs font-semibold text-white truncate">{teams.home.name}</span>
                        </button>
                        <button onClick={() => handleVote('draw')} className="flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-gray-800/60 hover:bg-brand-purple transition-all duration-200 transform hover:-translate-y-1">
                            <span className="font-bold text-3xl text-white">=</span>
                            <span className="text-xs font-semibold text-white">DRAW</span>
                        </button>
                        <button onClick={() => handleVote('away')} className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-800/60 hover:bg-brand-purple transition-all duration-200 transform hover:-translate-y-1">
                            <Image src={teams.away.logo} alt={teams.away.name} width={48} height={48} className="object-contain h-12"/>
                            <span className="text-xs font-semibold text-white truncate">{teams.away.name}</span>
                        </button>
                    </div>
                </>
            ) : (
                // --- RESULTS VIEW (After Voting) ---
                <>
                    <h4 className="text-xs font-bold text-center text-brand-muted mb-2 tracking-widest">COMMUNITY VOTE</h4>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-white">{homePercent}%</span>
                        <span className="text-xs text-brand-muted">Draw {drawPercent}%</span>
                        <span className="text-sm font-bold text-white">{awayPercent}%</span>
                    </div>
                    <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-800 mb-4">
                        <div className="bg-brand-purple" style={{ width: `${homePercent}%` }}></div>
                        <div className="bg-gray-500" style={{ width: `${drawPercent}%` }}></div>
                        <div className="bg-blue-600" style={{ width: `${awayPercent}%` }}></div>
                    </div>
                    <div className="relative">
                        <span className="absolute top-0 left-0 inline-flex h-full w-full rounded-lg bg-orange-400 opacity-75 animate-ping"></span>
                        <button onClick={handleBetClick} className="relative w-full bg-orange-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                            Bet 10€ and Win 1000 €
                        </button>
                    </div>
                    <p className="text-xs text-brand-muted mt-1.5 text-center">18+. Gamble responsibly. Verified Partner chinchincasino.com.</p>
                </>
            )}
        </div>
    );
});

export default VotingPanel;