// src/components/LiveMatchUpdater.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
// --- IMPORT THE NEW COMPONENTS ---
import SidebarMatchItem, { SidebarMatchItemSkeleton } from './SidebarMatchItem';

interface MatchData {
  fixture: { id: number; status: { elapsed: number; }; };
  teams: { home: any; away: any; };
  goals: { home: any; away: any; };
}

const fetchGlobalLiveMatches = async (): Promise<MatchData[]> => {
    const { data } = await axios.get('/api/global-live');
    return data;
};

export default function LiveMatchUpdater({ initialLiveMatches }: { initialLiveMatches: MatchData[] }) {
  
  const { data: liveMatches, isLoading } = useQuery<MatchData[]>({
    queryKey: ['globalLiveMatches'],
    queryFn: fetchGlobalLiveMatches,
    initialData: initialLiveMatches,
    refetchInterval: 30000,
  });

  // This check handles the initial server-side render where `isLoading` is false
  // but we might not have data yet. `liveMatches` from `useQuery` will be defined
  // because we provide `initialData`.
  if (!liveMatches || liveMatches.length === 0) {
      return <p className="text-sm text-brand-muted text-center py-4">No matches are currently live.</p>;
  }

  return (
    <div className="space-y-1">
      {/* Show top 5 live matches using the new component */}
      {liveMatches.slice(0, 5).map(match => (
        <SidebarMatchItem key={match.fixture.id} match={match} />
      ))}
    </div>
  );
}