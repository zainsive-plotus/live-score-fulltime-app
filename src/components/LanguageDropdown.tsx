"use client";

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

const languages = {
    en: { name: 'English', flag: '/flags/gb.png' },
    tr: { name: 'Türkçe', flag: '/flags/tr.png' }
};

export default function LanguageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useLanguage();

  const selectedLanguage = languages[locale];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-brand-secondary px-3 py-2 rounded-lg text-brand-light font-medium hover:bg-gray-700/50 transition-colors"
      >
        <Image src={selectedLanguage.flag} alt={selectedLanguage.name} width={20} height={15} />
        <span className="text-sm hidden md:block">{selectedLanguage.name}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-40 bg-brand-secondary rounded-lg shadow-lg z-50 border border-gray-700/50">
          <ul className="text-brand-light">
            {(Object.keys(languages) as Array<keyof typeof languages>).map((key) => (
              <li key={key}>
                <button
                  onClick={() => { setLocale(key); setIsOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-brand-purple transition-colors"
                >
                  <Image src={languages[key].flag} alt={languages[key].name} width={20} height={15} />
                  <span>{languages[key].name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}