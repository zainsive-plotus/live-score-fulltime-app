// src/components/SidebarMatchItem.tsx
"use client"; // This component is static but used in a client component, so it's good practice.

import Image from 'next/image';
import Link from '@/components/StyledLink'; 

interface SidebarMatchItemProps {
  match: {
    fixture: {
      id: number;
      status: {
        elapsed: number;
      };
    };
    teams: {
      home: { name: string; logo: string; };
      away: { name: string; logo: string; };
    };
    goals: {
      home: number;
      away: number;
    };
  };
}

// --- Main Minimal List Item Component for Sidebar ---
export default function SidebarMatchItem({ match }: SidebarMatchItemProps) {
  const { fixture, teams, goals } = match;

  return (
    <Link 
      href={`/football/match/${fixture.id}`} 
      className="block p-2.5 rounded-lg transition-colors duration-200 hover:bg-gray-700/50"
    >
      <div className="flex items-center gap-3 w-full">
        {/* Live Status */}
        <div className="flex flex-col items-center w-10 text-center text-brand-live font-semibold text-sm">
          <span>{fixture.status.elapsed}'</span>
          <div className="relative flex h-2 w-2 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-live"></span>
          </div>
        </div>
        
        {/* Teams and Score */}
        <div className="flex-1 space-y-1.5 text-sm">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Image src={teams.home.logo} alt={teams.home.name} width={18} height={18} />
              <span className="font-medium truncate">{teams.home.name}</span>
            </div>
            <span className="font-bold">{goals.home}</span>
          </div>
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Image src={teams.away.logo} alt={teams.away.name} width={18} height={18} />
              <span className="font-medium truncate">{teams.away.name}</span>
            </div>
            <span className="font-bold">{goals.away}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- Skeleton for the Sidebar Match Item ---
export const SidebarMatchItemSkeleton = () => (
    <div className="flex items-center gap-3 w-full p-2.5 animate-pulse">
        <div className="flex flex-col items-center w-10">
            <div className="h-4 w-6 rounded bg-gray-600/50"></div>
            <div className="h-2 w-2 rounded-full bg-gray-600/50 mt-1.5"></div>
        </div>
        <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
                <div className="h-4 w-3/5 rounded bg-gray-600/50"></div>
                <div className="h-4 w-4 rounded bg-gray-600/50"></div>
            </div>
            <div className="flex items-center justify-between">
                <div className="h-4 w-3/5 rounded bg-gray-600/50"></div>
                <div className="h-4 w-4 rounded bg-gray-600/50"></div>
            </div>
        </div>
    </div>
);