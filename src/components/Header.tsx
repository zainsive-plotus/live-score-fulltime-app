"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Bell, Menu, X, Aperture, ArrowRight } from "lucide-react";
import CountryDropdown from "./CountryDropdown";
import LanguageDropdown from "./LanguageDropdown";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "./StyledLink";
import NavDropdown from "./NavDropdown";

export default function Header() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // --- NEW, STRUCTURED NAVIGATION ARRAY ---
  // This makes the navigation much easier to manage and extend
  const navItems = [
    {
      title: t("football"),
      isDropdown: true,
      subLinks: [
        {
          name: t("leagues"),
          href: "/football/leagues",
          description: "Browse all competitions",
        },
        {
          name: t("teams"),
          href: "/football/teams",
          description: "Find your favorite club",
        },
        {
          name: t("news"),
          href: "/football/news",
          description: "The latest headlines",
        },
      ],
      href: "/",
    },
    // When you're ready, just add the new sport here!
    { title: t("basketball"), href: "/basketball" },
    { title: t("tennis"), href: "/tennis" },
  ];

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-grey-700/50 top-0 z-50 border-b border-gray-700/50">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-6">
        <StyledLink href="/" className="flex items-center gap-3 group">
          <Image
            src={"/fanskor.webp"}
            alt="fanskor-logo"
            width={250}
            height={100}
          />
        </StyledLink>

        {/* --- DESKTOP NAVIGATION --- */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item.title} className="list-none">
              {item.isDropdown && item.subLinks ? (
                <NavDropdown title={item.title} subLinks={item.subLinks} />
              ) : (
                <StyledLink
                  href={item.href!}
                  className={`relative py-2 text-base font-medium transition-colors ${
                    pathname.startsWith(item.href!)
                      ? "text-white"
                      : "text-brand-muted hover:text-white"
                  }`}
                >
                  {item.title}
                </StyledLink>
              )}
            </li>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4">
            <LanguageDropdown />
            {/* <CountryDropdown /> */}
          </div>
          <button
            className="lg:hidden text-brand-muted"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* --- UPDATED MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-brand-dark border-t border-gray-700/50 p-4 space-y-4">
          <nav>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.title}>
                  {item.isDropdown ? (
                    <div className="space-y-2">
                      <p className="p-3 text-sm font-bold uppercase text-brand-muted tracking-wider">
                        {item.title}
                      </p>
                      <ul className="space-y-1 pl-4 border-l-2 border-gray-700/50">
                        {item.subLinks!.map((subLink) => (
                          <li key={subLink.name}>
                            <StyledLink
                              href={subLink.href}
                              onClick={handleMobileLinkClick}
                              className="flex justify-between items-center w-full rounded-lg p-3 text-base font-medium text-brand-light hover:bg-gray-700/50"
                            >
                              <span>{subLink.name}</span>
                              <ArrowRight size={16} />
                            </StyledLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <StyledLink
                      href={item.href!}
                      onClick={handleMobileLinkClick}
                      className="block w-full rounded-lg p-3 text-base font-medium text-brand-light hover:bg-gray-700/50"
                    >
                      {item.title}
                    </StyledLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <hr className="border-gray-700/50" />
          <div className="flex items-center justify-between gap-4">
            <CountryDropdown />
            <LanguageDropdown />
          </div>
        </div>
      )}
    </header>
  );
}
