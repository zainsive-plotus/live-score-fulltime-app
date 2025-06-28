// src/components/match/HeaderOdds.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface HeaderOddsProps {
  fixtureId: number;
}

const fetchOdds = async (fixtureId: number) => {
  // We use our existing /api/odds route which is optimized for one bookmaker
  const { data } = await axios.get(`/api/odds?fixture=${fixtureId}`);
  return data;
};

export default function HeaderOdds({ fixtureId }: HeaderOddsProps) {
  const { data: odds, isLoading } = useQuery({
    queryKey: ["headerOdds", fixtureId],
    queryFn: () => fetchOdds(fixtureId),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!fixtureId,
  });

  const OddBox = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-800/50 w-16 h-14">
      <span className="text-xs text-brand-muted">{label}</span>
      <span className="text-sm font-bold text-white">{value || "-"}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 mt-4 animate-pulse">
        <div className="w-16 h-14 bg-gray-700/50 rounded-md"></div>
        <div className="w-16 h-14 bg-gray-700/50 rounded-md"></div>
        <div className="w-16 h-14 bg-gray-700/50 rounded-md"></div>
      </div>
    );
  }

  if (!odds) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <OddBox label="Home" value={odds.home} />
      <OddBox label="Draw" value={odds.draw} />
      <OddBox label="Away" value={odds.away} />
    </div>
  );
}
