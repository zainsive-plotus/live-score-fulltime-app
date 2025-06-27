"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

type Odds = { home: string; draw: string; away: string; } | undefined | null;

const fetchOdds = async (fixtureId: number): Promise<Odds> => {
    try {
        const { data } = await axios.get(`/api/odds?fixture=${fixtureId}`);
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const OddBox = ({ label, value }: { label: string, value: string }) => (
    <div className="flex-1 flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: 'var(--color-primary)' }}>
        <span className="font-bold text-sm text-text-muted">{label}</span>
        <span className="font-bold text-sm text-brand-highlight">{value}</span>
    </div>
);

export default function OddsDisplay({ fixtureId, initialOdds }: { fixtureId: number, initialOdds?: Odds }) {
    const { data: odds, isLoading, isError } = useQuery({
        queryKey: ['odds', fixtureId],
        queryFn: () => fetchOdds(fixtureId),
        // CRITICAL: Only enable the query if initialOdds are NOT provided
        enabled: !initialOdds,
        // Pass the live odds as initial data to prevent fetching if they already exist
        initialData: initialOdds,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const displayData = initialOdds || odds;

    if (isLoading && !initialOdds) {
        return <div className="text-xs text-center text-text-muted p-2 animate-pulse">Loading Odds...</div>;
    }

    if (isError || !displayData) {
        return <div className="text-xs text-center text-text-muted p-2">Odds not available.</div>;
    }

    return (
        <div className="flex items-center justify-center gap-2">
            <OddBox label="1" value={displayData.home} />
            <OddBox label="X" value={displayData.draw} />
            <OddBox label="2" value={displayData.away} />
        </div>
    );
}