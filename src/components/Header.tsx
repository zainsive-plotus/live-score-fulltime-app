"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  FaBasketballBall,
  FaTrophy,
  FaUsers,
  FaNewspaper,
} from "react-icons/fa";

import { IoMdFootball } from "react-icons/io";
import { IoTennisball } from "react-icons/io5";
import LanguageDropdown from "./LanguageDropdown";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "./StyledLink";
import NavDropdown from "./NavDropdown";
import { ArrowRight, Bell, Menu, X } from "lucide-react";

// Define a type for the Lucide icon components
type NavIcon = React.ElementType;

interface SubLink {
  name: string;
  href: string;
  description: string;
  icon?: NavIcon;
}

interface NavItem {
  title: string;
  href: string;
  icon: NavIcon;
  isDropdown?: boolean;
  subLinks?: SubLink[];
}

export default function Header() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false); // New state for desktop search
  const [searchTerm, setSearchTerm] = useState(""); // New state for search input
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: t("football"),
      href: "/football",
      icon: IoMdFootball, // Using FaSoccerBall from react-icons/fa
      isDropdown: true,
      subLinks: [
        {
          name: t("leagues"),
          href: "/football/leagues",
          description: "Browse all competitions",
          icon: FaTrophy, // Using FaTrophy from react-icons/fa
        },
        {
          name: t("teams"),
          href: "/football/teams",
          description: "Find your favorite club",
          icon: FaUsers, // Using FaUsers from react-icons/fa
        },
        {
          name: t("news"),
          href: "/football/news",
          description: "The latest headlines",
          icon: FaNewspaper, // Using FaNewspaper from react-icons/fa
        },
      ],
    },
    { title: t("basketball"), href: "#", icon: FaBasketballBall }, // Using FaBasketballBall
    { title: t("tennis"), href: "#", icon: IoTennisball }, // Using FaTennisBall
  ];

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Implement your search logic here, e.g., redirect to a search results page
      console.log("Searching for:", searchTerm);
      // router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      setIsSearchExpanded(false); // Collapse search bar after search
      setSearchTerm("");
      setIsMobileMenuOpen(false); // Close mobile menu if search initiated from there
    }
  };

  return (
    <>
      {/* Main Header (Non-sticky for desktop, sticky for mobile) */}
      <header className="relative w-full border-b border-gray-700/50 shadow-xl shadow-black/20 z-50 lg:static">
        <div className="container mx-auto flex h-24 items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <StyledLink href="/" className="flex items-center flex-shrink-0">
            <Image
              src={"/fanskor.webp"}
              alt="fanskor-logo"
              width={180}
              height={60}
            />
          </StyledLink>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden lg:flex items-center flex-grow justify-center gap-12 px-8">
            {navItems.map((item) => (
              <li key={item.title} className="list-none">
                {item.isDropdown && item.subLinks ? (
                  <NavDropdown
                    title={item.title}
                    icon={item.icon}
                    subLinks={item.subLinks}
                  />
                ) : (
                  <StyledLink
                    href={item.href}
                    className={`relative flex items-center gap-2 py-2 text-base font-semibold transition-colors group ${
                      pathname.startsWith(item.href)
                        ? "text-white"
                        : "text-[var(--text-secondary)] hover:text-white"
                    } 
                    ${
                      pathname.startsWith(item.href)
                        ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--brand-accent)] after:rounded-t-sm"
                        : "after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-[var(--brand-accent)] after:rounded-t-sm group-hover:after:w-full group-hover:after:left-0 after:transition-all after:duration-300"
                    }
                    `}
                  >
                    <item.icon size={20} />
                    {item.title}
                  </StyledLink>
                )}
              </li>
            ))}
          </nav>

          {/* Right-Hand Utility Icons (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <button className="text-[var(--text-primary)] hover:text-white transition-colors p-2">
              <Bell size={24} />
            </button>
            <LanguageDropdown />
            {/* <CountryDropdown /> */}
          </div>

          {/* MOBILE MENU BUTTONS (always visible on mobile) */}
          <div className="flex lg:hidden items-center gap-4 flex-shrink-0">
            <button className="text-[var(--text-primary)] hover:text-white transition-colors p-2">
              <Bell size={24} />
            </button>
            <button
              className="text-[var(--text-primary)] hover:text-white transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex flex-col transform translate-x-0 animate-slide-in-right">
          {/* Header within Overlay */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50 flex-shrink-0">
            <StyledLink href="/" className="flex items-center gap-3 group">
              <Image
                src={"/fanskor.webp"}
                alt="fanskor-logo"
                width={150}
                height={50}
              />
            </StyledLink>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[var(--text-primary)] hover:text-white transition-colors p-2"
              aria-label="Close mobile menu"
            >
              <X size={32} />
            </button>
          </div>

          <div
            className="mt-8 pb-4 border-b
           border-gray-800/50 flex flex-col gap-4 px-6 flex-shrink-0"
          >
            <LanguageDropdown />
            {/* <CountryDropdown /> */}
          </div>

          {/* Main Navigation in Mobile Menu */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.title}>
                  {item.isDropdown ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          // This simulates opening the dropdown in mobile
                          // You might want to pass state to NavDropdown for true controlled open/close
                          // For simplicity, for now it will act as a heading for its sub-links.
                          // A more advanced mobile dropdown would toggle an inner div.
                        }}
                        className="w-full text-left px-4 py-3 text-lg font-bold uppercase text-[var(--text-muted)] tracking-wider border-b border-gray-800/50 flex items-center gap-3"
                      >
                        <item.icon size={24} />
                        {item.title}
                      </button>
                      <ul className="space-y-2 pl-4 border-l-2 border-gray-700/50">
                        {item.subLinks!.map((subLink) => (
                          <li key={subLink.name}>
                            <StyledLink
                              href={subLink.href}
                              onClick={handleMobileLinkClick}
                              className="flex justify-between items-center w-full rounded-lg p-3 text-lg font-medium text-[var(--text-primary)] hover:bg-[var(--color-secondary)]"
                            >
                              <span className="flex items-center gap-3">
                                {subLink.icon && <subLink.icon size={24} />}{" "}
                                {subLink.name}
                              </span>
                              <ArrowRight
                                size={24}
                                className="text-[var(--brand-accent)]"
                              />
                            </StyledLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <StyledLink
                      href={item.href}
                      onClick={handleMobileLinkClick}
                      className="block w-full rounded-lg p-4 text-xl font-bold text-[var(--text-primary)] hover:bg-[var(--color-secondary)] flex items-center gap-4"
                    >
                      <item.icon size={28} />
                      {item.title}
                    </StyledLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Utility Section in Mobile Menu */}
        </div>
      )}
    </>
  );
}
