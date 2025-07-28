"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  FaBasketballBall,
  FaTrophy,
  FaUsers,
  FaNewspaper,
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";

import { IoMdFootball } from "react-icons/io";
import { IoTennisball } from "react-icons/io5";
import LanguageDropdown from "./LanguageDropdown";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "./StyledLink";
import NavDropdown from "./NavDropdown";
import NotificationDropdown from "./NotificationDropdown";
import { ArrowRight, Bell, Menu, X } from "lucide-react";
import Ticker from "./Ticker";

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

const fetchLatestPost = async (): Promise<IPost | null> => {
  try {
    const { data } = await axios.get("/api/posts?status=published&limit=1");
    return data[0] || null;
  } catch {
    return null;
  }
};

export default function Header() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { data: latestPost } = useQuery<IPost | null>({
    queryKey: ["latestPostForIndicator"],
    queryFn: fetchLatestPost,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (latestPost) {
      const lastReadPostId = localStorage.getItem("lastReadPostId");
      if (latestPost._id !== lastReadPostId) {
        setHasUnread(true);
      }
    }
  }, [latestPost]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationToggle = () => {
    setIsNotificationOpen((prev) => !prev);
    if (hasUnread && latestPost) {
      localStorage.setItem("lastReadPostId", latestPost._id as string);
      setHasUnread(false);
    }
  };

  const navItems: NavItem[] = [
    {
      title: t("football"),
      href: "/football",
      icon: IoMdFootball,
      isDropdown: true,
      subLinks: [
        {
          name: t("leagues"),
          href: "/football/leagues",
          description: t("leagues_description"),
          icon: FaTrophy,
        },
        {
          name: t("teams"),
          href: "/football/teams",
          description: t("teams_description"),
          icon: FaUsers,
        },
        {
          name: t("football_news"),
          href: "/football/news",
          description: t("football_news_description"),
          icon: FaNewspaper,
        },
      ],
    },
    { title: t("basketball"), href: "#", icon: FaBasketballBall },
    { title: t("tennis"), href: "#", icon: IoTennisball },
    {
      title: t("news"),
      href: "/news",
      icon: FaNewspaper,
    },
  ];

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
    <>
      {/* ----- THE FIX IS HERE: `lg:static` has been removed ----- */}
      <header className="relative w-full border-b border-gray-700/50 shadow-xl shadow-black/20 z-50">
        <div className="container mx-auto flex h-24 items-center justify-between px-4 lg:px-6">
          <StyledLink href="/" className="flex items-center flex-shrink-0">
            <Image
              src={"/fanskor.webp"}
              alt="fanskor-logo"
              width={180}
              height={60}
            />
          </StyledLink>
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
                    } ${
                      pathname.startsWith(item.href)
                        ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--brand-accent)] after:rounded-t-sm"
                        : "after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-[var(--brand-accent)] after:rounded-t-sm group-hover:after:w-full group-hover:after:left-0 after:transition-all after:duration-300"
                    }`}
                  >
                    <item.icon size={20} />
                    {item.title}
                  </StyledLink>
                )}
              </li>
            ))}
          </nav>

          <div
            className="hidden lg:flex items-center gap-6 flex-shrink-0"
            ref={notificationRef}
          >
            <div className="relative">
              <button
                onClick={handleNotificationToggle}
                className="text-brand-light hover:text-white transition-colors p-2"
              >
                <Bell
                  size={24}
                  className={`text-[var(--brand-accent)] ${
                    hasUnread ? "animate-ring" : ""
                  }`}
                />
                {hasUnread && (
                  <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-brand-dark" />
                )}
              </button>
              {isNotificationOpen && (
                <NotificationDropdown
                  onClose={() => setIsNotificationOpen(false)}
                />
              )}
            </div>
            <LanguageDropdown />
          </div>

          <div
            className="flex lg:hidden items-center gap-2 flex-shrink-0"
            ref={notificationRef}
          >
            <div className="relative">
              <button
                onClick={handleNotificationToggle}
                className="text-brand-light hover:text-white transition-colors p-2"
              >
                <Bell
                  size={24}
                  className={`text-[var(--brand-accent)] ${
                    hasUnread ? "animate-ring" : ""
                  }`}
                />
                {hasUnread && (
                  <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-brand-dark" />
                )}
              </button>
              {isNotificationOpen && (
                <NotificationDropdown
                  onClose={() => setIsNotificationOpen(false)}
                />
              )}
            </div>
            <button
              className="text-brand-light hover:text-white transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex flex-col transform translate-x-0 animate-slide-in-right">
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
              className="text-brand-light hover:text-white transition-colors p-2"
              aria-label="Close mobile menu"
            >
              <X size={32} />
            </button>
          </div>
          <div className="mt-8 pb-4 border-b border-gray-800/50 flex flex-col gap-4 px-6 flex-shrink-0">
            <LanguageDropdown />
          </div>
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4">
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.title}>
                  {item.isDropdown ? (
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-3 text-lg font-bold uppercase text-[var(--text-muted)] tracking-wider border-b border-gray-800/50 flex items-center gap-3">
                        <item.icon size={24} />
                        {item.title}
                      </button>
                      <ul className="space-y-2 pl-4 border-l-2 border-gray-700/50">
                        {item.subLinks!.map((subLink) => (
                          <li key={subLink.name}>
                            <StyledLink
                              href={subLink.href}
                              onClick={handleMobileLinkClick}
                              className="flex justify-between items-center w-full rounded-lg p-3 text-lg font-medium text-brand-light hover:bg-brand-secondary"
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
                      className="block w-full rounded-lg p-4 text-xl font-bold text-brand-light hover:bg-brand-secondary flex items-center gap-4"
                    >
                      <item.icon size={28} />
                      {item.title}
                    </StyledLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

    </>
      <Suspense fallback={null}>
       <Ticker />
      </Suspense>
    </>
  );
}
