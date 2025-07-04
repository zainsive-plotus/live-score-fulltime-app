"use client";

import { useState, Dispatch, SetStateAction } from "react";
// Import BrainCircuit for Analytics icon
import { List, Newspaper, BrainCircuit, Compass } from "lucide-react";
import { League } from "@/types/api-football";

// Import the content components
import MatchList from "./MatchList";
import NewsSection from "./NewsSection";
import ExploreTab from "./ExploreTab";

// Define the NEW tabs we want to show
const TABS = [
  { id: "matches", label: "Matches", icon: List },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "news", label: "News", icon: Newspaper },
];

interface MobileHomeTabsProps {
  liveLeagues: League[];
  setLiveLeagues: Dispatch<SetStateAction<League[]>>;
}

export default function MobileHomeTabs({
  liveLeagues,
  setLiveLeagues,
}: MobileHomeTabsProps) {
  const [activeTab, setActiveTab] = useState("matches");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-2 sm:p-4 space-y-8 overflow-y-auto">
        {activeTab === "matches" && (
          <MatchList setLiveLeagues={setLiveLeagues} />
        )}
        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "news" && <NewsSection />}
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-brand-secondary border-t border-gray-700/50 shadow-lg z-999999">
        <div className="flex justify-around items-center h-16">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${
                activeTab === tab.id
                  ? "text-brand-purple"
                  : "text-brand-muted hover:text-white"
              }`}
            >
              <tab.icon size={22} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
