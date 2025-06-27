// src/components/team/TeamTrophiesWidget.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Trophy } from "lucide-react";

const fetchTrophies = async (teamId: number) => {
  const { data } = await axios.get(`/api/team-trophies?team=${teamId}`);
  return data;
};

const Skeleton = () => (
  <div className="bg-brand-secondary p-4 rounded-lg animate-pulse">
    <div className="h-5 w-3/4 mb-4 bg-gray-700 rounded"></div>
    <div className="space-y-3">
      <div className="h-8 w-full bg-gray-600 rounded"></div>
      <div className="h-8 w-full bg-gray-600 rounded"></div>
      <div className="h-8 w-full bg-gray-600 rounded"></div>
    </div>
  </div>
);

export default function TeamTrophiesWidget({ teamId }: { teamId: number }) {
  const {
    data: trophies,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teamTrophies", teamId],
    queryFn: () => fetchTrophies(teamId),
    staleTime: 1000 * 60 * 60 * 24, // Trophies don't change often
  });

  if (isLoading) return <Skeleton />;
  if (isError || !trophies || trophies.length === 0) return null;

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-4">Honours</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
        {trophies.map((trophy: any, index: number) => (
          <div
            key={`${trophy.league}-${trophy.season}-${index}`}
            className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-md"
          >
            <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {trophy.league}
              </p>
              <p className="text-xs text-brand-muted">{trophy.season}</p>
            </div>
            <p className="text-sm font-bold text-brand-light">{trophy.place}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
