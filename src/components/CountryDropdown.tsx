"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, Globe } from 'lucide-react'; 
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Country } from '@/types/api-football';
import { useLeagueContext } from '@/context/LeagueContext';
import { useTranslation } from '@/hooks/useTranslation';

const fetchCountries = async (): Promise<Country[]> => {
  const { data } = await axios.get('/api/countries');
  return data;
};

export default function CountryDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  const { selectedCountry, setSelectedCountry } = useLeagueContext();

  const globalOption: Country = {
      name: t('global'),
      code: 'GLOBAL_VIEW',
      flagUrl: '',
  };

  const { data: countries, isLoading } = useQuery<Country[]>({
    queryKey: ['countries', globalOption.name], // Add translated name to key
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    select: (data) => {
      return [globalOption, ...data];
    },
  });
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: Country) => {
    if (country.code === 'GLOBAL_VIEW') {
      setSelectedCountry(null);
    } else {
      setSelectedCountry(country);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 bg-brand-secondary px-4 py-2 rounded-lg text-brand-light font-medium hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-wait w-40 justify-between"
      >
        {isLoading ? (
          <span className="flex-grow text-left">{t('loading')}...</span>
        ) : selectedCountry ? (
          <>
            <Image 
              src={selectedCountry.flagUrl} 
              alt={selectedCountry.name} 
              width={20} 
              height={15} 
              className="flex-shrink-0"
            />
            <span className="truncate flex-grow text-left">{selectedCountry.name}</span>
          </>
        ) : (
          <>
            <Globe size={16} className="flex-shrink-0" />
            <span className="truncate flex-grow text-left">{t('global')}</span>
          </>
        )}
        <ChevronDown size={16} className={`transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && countries && (
        <div className="absolute top-full mt-2 w-56 max-h-80 overflow-y-auto bg-brand-secondary rounded-lg shadow-lg z-50 border border-gray-700/50 custom-scrollbar">
          <ul className="text-brand-light">
            {countries.map((country) => (
              <li key={country.code || country.name}>
                <button
                  onClick={() => handleSelect(country)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-brand-purple transition-colors"
                >
                  {country.code === 'GLOBAL_VIEW' ? (
                    <Globe size={16} className="h-4 w-5 text-center" />
                  ) : (
                    <Image src={country.flagUrl} alt={country.name} width={20} height={15} />
                  )}
                  <span>{country.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}