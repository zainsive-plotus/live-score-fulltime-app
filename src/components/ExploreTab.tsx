"use client";

import { Search } from 'lucide-react';
import PopularLeaguesSlider from './explore/PopularLeaguesSlider';
import PopularTeamsGrid from './explore/PopularTeamsGrid';
import BrowseByCountry from './explore/BrowseByCountry';

export default function ExploreTab() {
  return (
    <div className="p-4 space-y-8">
      {/* 1. Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
        <input
          type="text"
          placeholder="Search for leagues, teams..."
          className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
      </div>

       <section>
        <h2 className="text-xl font-bold text-white mb-4">Popular Leagues</h2>
        <PopularLeaguesSlider />
      </section>

      {/* This now renders our simplified, non-interactive grid */}
      <PopularTeamsGrid /> 
      
      <section>
        <BrowseByCountry />
      </section>
    </div>
  );
}