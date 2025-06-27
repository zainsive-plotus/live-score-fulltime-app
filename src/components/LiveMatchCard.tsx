"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from '@/components/StyledLink'; 
import { History, BarChart2, Star } from 'lucide-react'; // Import the Star icon
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useVoteStorage } from '@/hooks/useVoteStorage';
import { useTranslation } from '@/hooks/useTranslation';

// --- Type Definitions for Vote Data ---
interface VoteData {
    homeVotes: number;
    drawVotes: number;
    awayVotes: number;
}

// --- API Helper Functions (integrated from VotingPanel) ---
const getVotes = async (fixtureId: number): Promise<VoteData> => {
    const { data } = await axios.get(`/api/votes?fixture=${fixtureId}`);
    return data;
};

const submitVote = async ({ fixtureId, vote }: { fixtureId: number; vote: string }): Promise<VoteData> => {
    const { data } = await axios.post('/api/votes', { fixtureId, vote });
    return data;
};

// --- A sub-component for a single team row for cleanliness ---
const TeamRow = ({ team, score, hasMomentum, momentumType, onVote, isVotedFor, isDisabled }: any) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
                <Image src={team.logo} alt={team.name} width={32} height={32} className="object-contain h-8 w-8"/>
                {hasMomentum && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className={`absolute inline-flex h-full w-full rounded-full ${momentumType === 'Goal' ? 'bg-green-400' : 'bg-red-400'} opacity-75 animate-ping`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${momentumType === 'Goal' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                )}
            </div>
            <span className="font-bold text-white truncate">{team.name}</span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xl font-black text-white">{score ?? 0}</span>
            <button onClick={onVote} disabled={isDisabled} className="disabled:cursor-not-allowed disabled:opacity-50">
                <Star size={20} className={`transition-all duration-200 ${isVotedFor ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`} />
            </button>
        </div>
    </div>
);


export default function MobileLiveMatchCard({ match }: { match: any }) {
  const { fixture, teams, goals, league, events } = match;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setVote, getVoteForFixture } = useVoteStorage();

  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.status.short);
  
  // State to track the user's vote for this specific match
  const [votedFor, setVotedFor] = useState<'home' | 'away' | null>(() => getVoteForFixture(fixture.id) as 'home' | 'away' | null);

  // Fetch community vote data
  const { data: voteData } = useQuery({
      queryKey: ['votes', fixture.id],
      queryFn: () => getVotes(fixture.id),
      staleTime: 1000 * 60,
      enabled: !isFinished, // Only fetch for non-finished matches
  });

  // Mutation to submit a vote
  const voteMutation = useMutation({
      mutationFn: submitVote,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['votes', fixture.id] });
      },
  });

  const handleVote = (choice: 'home' | 'away') => {
      if (votedFor) return; // Prevent re-voting
      setVotedFor(choice);
      setVote(fixture.id, choice);
      voteMutation.mutate({ fixtureId: fixture.id, vote: choice });
  };
  
  const momentumData = useMemo(() => {
    // ... (momentum logic remains unchanged)
    if (!['1H', 'HT', '2H', 'ET', 'P'].includes(fixture.status.short) || !events || events.length === 0) return { teamId: null, type: null };
    const lastMajorEvent = [...events].reverse().find(e => e.type === 'Goal' || (e.type === 'Card' && e.detail === 'Red Card'));
    if (!lastMajorEvent) return { teamId: null, type: null };
    let momentumTeamId = lastMajorEvent.team.id;
    if (lastMajorEvent.type === 'Card') {
        momentumTeamId = momentumTeamId === teams.home.id ? teams.away.id : teams.home.id;
    }
    return { teamId: momentumTeamId, type: lastMajorEvent.type };
  }, [events, fixture.status.short, teams.home.id, teams.away.id]);

  // Calculate vote percentages for the progress bar
  const totalVotes = (voteData?.homeVotes || 0) + (voteData?.awayVotes || 0);
  const homePercent = totalVotes > 0 ? Math.round(((voteData?.homeVotes || 0) / totalVotes) * 100) : 50;

  return (
    <div className="bg-[#252837] rounded-xl overflow-hidden flex flex-col">
      {/* HEADER: League & Status */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2 min-w-0">
            <Image src={league.logo} alt={league.name} width={20} height={20} className="flex-shrink-0" />
            <span className="text-sm font-semibold truncate text-brand-muted">{league.name}</span>
          </div>
          <div className="flex-shrink-0">
            {['1H', 'HT', '2H', 'ET', 'P'].includes(fixture.status.short) && <div className="flex items-center gap-1.5 text-brand-live font-semibold text-xs"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-live"></span></span><span>{fixture.status.elapsed}'</span></div>}
            {isFinished && <div className="flex items-center gap-1.5 bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full text-xs font-semibold"><History size={12} /><span>{t('finished')}</span></div>}
            {!isFinished && !['1H', 'HT', '2H', 'ET', 'P'].includes(fixture.status.short) && <div className="font-bold text-brand-light text-sm">{format(new Date(fixture.date), "HH:mm")}</div>}
          </div>
      </div>

      {/* BODY: Vertically Stacked Teams with Star Voting */}
      <div className="p-3 space-y-2">
          <TeamRow 
            team={teams.home} 
            score={goals.home} 
            hasMomentum={momentumData.teamId === teams.home.id}
            momentumType={momentumData.type}
            onVote={() => handleVote('home')}
            isVotedFor={votedFor === 'home'}
            isDisabled={!!votedFor || isFinished}
          />
          <TeamRow 
            team={teams.away} 
            score={goals.away} 
            hasMomentum={momentumData.teamId === teams.away.id}
            momentumType={momentumData.type}
            onVote={() => handleVote('away')}
            isVotedFor={votedFor === 'away'}
            isDisabled={!!votedFor || isFinished}
          />
      </div>

      {/* NEW: Community Rating Progress Bar (shows after voting) */}
      {votedFor && voteData && (
          <div className="px-3 pb-3 space-y-2">
              <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{homePercent}%</span>
                  <span className="text-xs font-semibold text-brand-muted">Community Rating</span>
                  <span className="text-xs font-bold text-white">{100 - homePercent}%</span>
              </div>
              <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-700">
                  <div className="bg-brand-purple" style={{ width: `${homePercent}%` }}></div>
                  <div className="bg-blue-600" style={{ width: `${100 - homePercent}%` }}></div>
              </div>
          </div>
      )}
      
      {/* FOOTER: Match Details Link */}
      <div className="p-2 bg-gray-900/30 flex justify-end items-center">
        <Link href={`/football/match/${fixture.id}`} className="flex items-center gap-2 text-xs text-brand-muted hover:text-white transition-colors py-1 px-2">
            <BarChart2 size={14} />
            <span>{t('match_details')}</span>
        </Link>
      </div>
    </div>
  );
}

export const MatchCardSkeleton = () => (
    <div className="bg-[#252837] rounded-xl p-4 flex flex-col gap-4 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-4 w-1/3 rounded bg-gray-600/50"></div>
            <div className="h-4 w-1/4 rounded bg-gray-600/50"></div>
        </div>
        <div className="flex items-center justify-between py-4">
            <div className="flex flex-col items-center gap-2 w-1/3"><div className="h-12 w-12 rounded-full bg-gray-600/50"></div><div className="h-4 w-2/3 rounded bg-gray-600/50"></div></div>
            <div className="h-8 w-1/4 rounded bg-gray-600/50"></div>
            <div className="flex flex-col items-center gap-2 w-1/3"><div className="h-12 w-12 rounded-full bg-gray-600/50"></div><div className="h-4 w-2/3 rounded bg-gray-600/50"></div></div>
        </div>
        <div className="h-10 w-full rounded-lg bg-gray-600/50 mt-auto"></div>
    </div>
);