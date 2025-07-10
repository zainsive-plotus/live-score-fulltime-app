"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { List, Newspaper, Compass } from "lucide-react";
import { League } from "@/types/api-football";
import MatchList from "./MatchList";
import NewsSection from "./NewsSection";
import ExploreTab from "./ExploreTab";

// The TABS array remains the same.
const TABS = [
  { id: "matches", label: "Matches", icon: List },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "news", label: "News", icon: Newspaper },
];

interface MobileHomeTabsProps {
  liveLeagues: League[];
  setLiveLeagues: Dispatch<SetStateAction<League[]>>;
}

// --- Reusable Button Sub-component for cleanliness ---
const TabButton = ({
  tab,
  isActive,
  onClick,
}: {
  tab: (typeof TABS)[0];
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex h-12 w-1/3 flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-300 ease-in-out
      ${
        isActive
          ? "bg-[var(--brand-accent)] text-white" // Active state with solid accent background
          : "bg-transparent text-text-muted hover:text-white" // Inactive state
      }
    `}
    aria-label={tab.label}
  >
    <tab.icon size={20} /> {/* Reduced icon size to 20px */}
    <span className="text-xs font-bold">{tab.label}</span>
  </button>
);

export default function MobileHomeTabs({
  liveLeagues,
  setLiveLeagues,
}: MobileHomeTabsProps) {
  const [activeTab, setActiveTab] = useState("matches");

  return (
    // The main container ensures content can scroll behind the fixed tab bar
    <div className="flex flex-col h-full w-full">
      {/* --- CONTENT AREA --- */}
      {/* Adjusted bottom padding (pb-20) to account for the smaller dock height */}
      <main className="flex-grow p-2 sm:p-4 space-y-8 overflow-y-auto pb-20">
        {activeTab === "matches" && (
          <MatchList setLiveLeagues={setLiveLeagues} />
        )}
        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "news" && <NewsSection />}
      </main>

      {/* --- FLOATING DOCK (REDESIGNED TAB BAR) --- */}
      {/* Reduced outer padding (px-3 pb-3) and inner padding of the dock itself (p-1) */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-3 pointer-events-none">
        <div
          className="pointer-events-auto mx-auto flex max-w-xs items-center justify-around rounded-full 
                     bg-black/50 p-1 shadow-2xl shadow-black/30 backdrop-blur-lg 
                     border border-white/10"
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
