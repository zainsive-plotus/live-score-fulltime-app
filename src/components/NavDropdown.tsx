"use client";

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import StyledLink from './StyledLink';

interface SubLink {
    name: string;
    href: string;
    description: string;
}

interface NavDropdownProps {
    title: string;
    subLinks: SubLink[];
}

export default function NavDropdown({ title, subLinks }: NavDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* The main navigation item */}
            <button className="flex items-center gap-1 py-2 text-base font-medium text-brand-light transition-colors hover:text-white">
                <span>{title}</span>
                <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>
            
            {/* The dropdown menu */}
            <div
                className={`absolute top-full pt-3 transition-all duration-300 ease-in-out ${
                    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
            >
                <div className="bg-brand-secondary rounded-lg shadow-2xl border border-gray-700/50 w-64 overflow-hidden">
                    <ul className="space-y-1 p-2">
                        {subLinks.map(link => (
                            <li key={link.name}>
                                <StyledLink
                                    href={link.href}
                                    className="block p-3 rounded-md hover:bg-brand-purple"
                                >
                                    <p className="font-bold text-white">{link.name}</p>
                                    <p className="text-sm text-brand-muted">{link.description}</p>
                                </StyledLink>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}