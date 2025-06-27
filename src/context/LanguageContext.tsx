"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

// Define the shape of the context data
interface LanguageContextType {
  locale: 'en' | 'tr';
  setLocale: Dispatch<SetStateAction<'en' | 'tr'>>;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create the Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default language is English
  const [locale, setLocale] = useState<'en' | 'tr'>('tr');

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Create a custom hook for easy consumption
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}