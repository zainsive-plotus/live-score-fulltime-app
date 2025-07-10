"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import StyledLink from "./StyledLink";
import { usePathname } from "next/navigation";

// Define a type for the Lucide icon components
type NavIcon = React.ElementType;

interface SubLink {
  name: string;
  href: string;
  description: string;
  icon?: NavIcon;
}

interface NavDropdownProps {
  title: string;
  icon: NavIcon;
  subLinks: SubLink[];
}

export default function NavDropdown({
  title,
  icon: Icon,
  subLinks,
}: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = subLinks.some((link) => pathname.startsWith(link.href));

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* The main navigation item - now uses font-semibold */}
      <button
        className={`flex items-center gap-2 py-2 text-base font-semibold transition-colors group
                    ${
                      isActive
                        ? "text-white"
                        : "text-[var(--text-secondary)] hover:text-white"
                    }
                    ${
                      isActive
                        ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--brand-accent)] after:rounded-t-sm"
                        : "after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-[var(--brand-accent)] after:rounded-t-sm group-hover:after:w-full group-hover:after:left-0 after:transition-all after:duration-300"
                    }
                `}
      >
        <Icon size={20} />
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* The dropdown menu - uses color-secondary for background */}
      <div
        className={`absolute top-full pt-3 transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-[var(--color-secondary)] rounded-lg shadow-2xl border border-gray-700/50 w-64 overflow-hidden">
          <ul className="space-y-1 p-2">
            {subLinks.map((link) => (
              <li key={link.name}>
                <StyledLink
                  href={link.href}
                  className="block p-3 rounded-md hover:bg-[var(--brand-accent)]/20 hover:text-[var(--brand-accent)] transition-colors"
                >
                  <p className="font-bold text-white flex items-center gap-2">
                    {link.icon && <link.icon size={20} />}{" "}
                    {/* Consistent icon size */}
                    {link.name}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {link.description}
                  </p>
                </StyledLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
