"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

// Define the shape of the context data
interface TimeZoneContextType {
  timeZone: string | null; // Will be null on the server, a string on the client
}

// Create the context with a default value of null
const TimeZoneContext = createContext<TimeZoneContextType | undefined>(
  undefined
);

/**
 * Provides the user's detected time zone to its children.
 * It detects the time zone on the client-side using a useEffect hook.
 */
export function TimeZoneProvider({ children }: { children: ReactNode }) {
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only once on the client after the component mounts.
    // Intl.DateTimeFormat().resolvedOptions().timeZone is the standard browser API
    // to get the user's IANA time zone name.
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(detectedTimeZone);
  }, []); // The empty dependency array ensures it runs only once

  return (
    <TimeZoneContext.Provider value={{ timeZone }}>
      {children}
    </TimeZoneContext.Provider>
  );
}

/**
 * Custom hook to easily access the user's time zone from any client component.
 * Throws an error if used outside of a TimeZoneProvider.
 */
export function useTimeZone() {
  const context = useContext(TimeZoneContext);
  if (context === undefined) {
    throw new Error("useTimeZone must be used within a TimeZoneProvider");
  }
  return context;
}
