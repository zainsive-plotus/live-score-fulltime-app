// src/components/FaqAccordion.tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqAccordionProps {
  question: string;
  answer: string;
}

export default function FaqAccordion({ question, answer }: FaqAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left p-6 hover:bg-[var(--color-primary)]/50 transition-colors"
        aria-expanded={isOpen}
      >
        {/* The question text now changes color when active */}
        <h3
          className={`text-lg font-semibold transition-colors ${
            isOpen ? "text-[var(--brand-accent)]" : "text-white"
          }`}
        >
          {question}
        </h3>
        <ChevronDown
          size={24}
          className={`text-[var(--brand-accent)] transform transition-transform duration-300 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {/* Added more padding for readability */}
          <div
            className="px-6 pb-6 text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        </div>
      </div>
    </div>
  );
}
