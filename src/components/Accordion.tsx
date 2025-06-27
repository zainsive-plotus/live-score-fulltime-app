"use client";

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: ReactNode; // Title can now be a component for more complex layouts
  statusNode?: ReactNode; // Optional node for the status badge
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function Accordion({ title, statusNode, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 transition-colors duration-200 bg-gray-800/50 hover:bg-gray-800/80"
      >
        {/* Left side containing title and status */}
        <div className="flex items-center gap-4">
            {/* The main title */}
            <div className="font-bold text-lg text-white text-left">{title}</div>
            {/* The optional status badge */}
            {statusNode}
        </div>
        
        {/* Right side with the chevron icon */}
        <ChevronDown
          size={24}
          className={`transform transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* The collapsible content area */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 space-y-3 bg-brand-dark/30">{children}</div>
        </div>
      </div>
    </div>
  );
}