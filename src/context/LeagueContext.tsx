// ===== src/context/LeagueContext.tsx =====

"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Country, League } from "@/types/api-football";

interface LeagueContextType {
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country | null) => void;
  // --- CORE CHANGE: selectedLeague is now an array of league IDs ---
  selectedLeagueIds: number[];
  setSelectedLeagueIds: Dispatch<SetStateAction<number[]>>;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  // --- CORE CHANGE: State is now an array of numbers ---
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>([]);

  const value = {
    selectedCountry,
    setSelectedCountry,
    selectedLeagueIds,
    setSelectedLeagueIds,
  };

  return (
    <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
  );
};

export const useLeagueContext = (): LeagueContextType => {
  const context = useContext(LeagueContext);
  if (!context)
    throw new Error("useLeagueContext must be used within a LeagueProvider");
  return context;
};
