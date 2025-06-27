"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Country, League } from "@/types/api-football";

interface LeagueContextType {
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country | null) => void;
  selectedLeague: League | null;
  setSelectedLeague: (league: League | null) => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  // --- CHANGE: Start with null state by default ---
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  // --- REMOVE: The entire useQuery and useEffect for finding a live match ---
  // The logic to pre-select a country and league is no longer needed.

  const value = { selectedCountry, setSelectedCountry, selectedLeague, setSelectedLeague };

  return (
    <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
  );
};

export const useLeagueContext = (): LeagueContextType => {
  const context = useContext(LeagueContext);
  if (!context) throw new Error("useLeagueContext must be used within a LeagueProvider");
  return context;
};