"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { Country } from '@/types/api-football';

// 1. Define the shape of the context data
interface CountryContextType {
  selectedCountry: Country | null;
  setSelectedCountry: Dispatch<SetStateAction<Country | null>>;
}

// 2. Create the context with a default value
const CountryContext = createContext<CountryContextType | undefined>(undefined);

// 3. Create the Provider component
export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

// 4. Create a custom hook for easy consumption
export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}