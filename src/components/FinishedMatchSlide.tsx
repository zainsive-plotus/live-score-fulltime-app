// src/components/FinishedMatchSlide.tsx
"use client";

import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, History } from 'lucide-react';

interface MatchSlideProps {
  match: any; // Use a more specific type if you have one
}

export default function FinishedMatchSlide({ match }: MatchSlideProps) {
  const { teams, fixture, goals, league } = match;

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-2xl bg-brand-secondary text-white">
      {/* Background Image & Overlay */}
      <Image
        src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop"
        alt="Dark stadium background"
        layout="fill"
        objectFit="cover"
        className="z-0 opacity-80"
      />
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
        <p className="font-semibold tracking-wider text-brand-muted flex items-center gap-2">
            <History size={14} />
            Recent Result
        </p>
        <p className="text-sm text-brand-muted mb-4">{league.round}</p>
        
        <div className="flex items-center justify-around w-full max-w-2xl my-2">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 text-center w-1/3">
            <Image src={teams.home.logo} alt={teams.home.name} width={48} height={48}/>
            <h2 className="text-xl font-bold truncate">{teams.home.name}</h2>
          </div>
          
          {/* Score */}
          <span className="text-5xl font-black text-white mx-4">
            {goals.home} - {goals.away}
          </span>
          
          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 text-center w-1/3">
            <Image src={teams.away.logo} alt={teams.away.name} width={48} height={48}/>
            <h2 className="text-xl font-bold truncate">{teams.away.name}</h2>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-brand-muted">
            <Calendar size={16} />
            <span>{format(new Date(fixture.date), "dd MMMM yyyy")}</span>
        </div>
      </div>
    </div>
  );
}