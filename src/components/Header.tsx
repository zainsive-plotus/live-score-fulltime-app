// ===== src/components/Header.tsx =====

"use client";

import { useState, useEffect, Suspense, Fragment } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Newspaper,
  PlayCircle,
  BrainCircuit,
  BookOpen,
  Repeat,
  Menu,
  X,
  Search,
  ChevronDown,
  ListOrdered,
  CalendarDays,
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import LanguageDropdown from "./LanguageDropdown";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "./StyledLink";
import Ticker from "./Ticker";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import HeaderSearchModal from "./HeaderSearchModal";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ILanguage } from "@/models/Language";

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

const fetchActiveLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};

export default function Header() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const pathname = usePathname();

  const { isSticky, isVisible } = useScrollDirection({ threshold: 50 });

  // Fetch languages here, in the parent component.
  const { data: languages, isLoading: isLoadingLanguages } = useQuery<
    ILanguage[]
  >({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      setIsMobileMenuOpen(false);
      setIsSearchOpen(false);
    }
  }, [pathname]);

  const navItems: NavItem[] = [
    { title: t("fixtures"), href: "/", icon: CalendarDays },
    { title: t("teams"), href: "/football/teams", icon: Users },
    { title: t("highlights"), href: "/highlights", icon: PlayCircle },
    { title: t("predictions"), href: "/predictions", icon: BrainCircuit },
    { title: t("standings"), href: "/football/standings", icon: ListOrdered },
    {
      title: t("news_and_stories"),
      href: "/news",
      icon: Newspaper,
      isDropdown: true,
      subLinks: [
        {
          name: t("latest_news"),
          href: "/news/category/recent",
          description: t("latest_news_desc"),
          icon: Newspaper,
        },
        {
          name: t("transfer_news"),
          href: "/news/category/transfer",
          description: t("transfer_news_desc"),
          icon: Repeat,
        },
        {
          name: t("blogs"),
          href: "/news/category/football",
          description: t("blogs_desc"),
          icon: BookOpen,
        },
      ],
    },
  ];

  const MobileFlyoutMenu = () => (
    <Transition.Root show={isMobileMenuOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[100] lg:hidden"
        onClose={setIsMobileMenuOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition ease-in-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-xs bg-brand-dark flex flex-col">
            <div className="flex items-center justify-between px-4 h-20 border-b border-gray-800 flex-shrink-0">
              <StyledLink href="/">
                <Image
                  src={"/fanskor.webp"}
                  alt="fanskor-logo"
                  width={150}
                  height={50}
                />
              </StyledLink>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2"
                aria-label="Close mobile menu"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-800">
              <LanguageDropdown
                languages={languages}
                isLoading={isLoadingLanguages}
              />
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    (pathname === item.href && item.href === "/") ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <li key={item.title}>
                      <StyledLink
                        href={item.href}
                        className={`flex items-center gap-4 w-full rounded-lg p-3 text-lg font-semibold transition-colors ${
                          isActive
                            ? "bg-[var(--brand-accent)] text-white"
                            : "text-brand-light hover:bg-brand-secondary"
                        }`}
                      >
                        <item.icon size={22} /> {item.title}
                      </StyledLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="p-4 mt-auto border-t border-gray-800">
              <div className="flex justify-center gap-x-6 text-xs text-text-muted">
                <StyledLink href="/privacy-policy" className="hover:text-white">
                  Privacy
                </StyledLink>
                <StyledLink
                  href="/terms-and-conditions"
                  className="hover:text-white"
                >
                  Terms
                </StyledLink>
                <StyledLink href="/contact-us" className="hover:text-white">
                  Contact
                </StyledLink>
              </div>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );

  return (
    <div
      className={`
        ${isSticky ? "sticky" : "relative"}
        top-0 z-50 w-full bg-brand-secondary
        transition-transform duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <header className="relative w-full z-40 border-b border-gray-700/50">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-x-6">
            <StyledLink href="/" className="flex-shrink-0">
              <Image
                src={"/fanskor.webp"}
                alt="fanskor-logo"
                width={160}
                height={54}
                priority
              />
            </StyledLink>
            <nav className="hidden lg:flex items-center gap-x-2">
              {navItems.map((item) => (
                <li
                  key={item.title}
                  className="list-none relative"
                  onMouseEnter={() =>
                    item.isDropdown && setOpenMenu(item.title)
                  }
                  onMouseLeave={() => item.isDropdown && setOpenMenu(null)}
                >
                  <StyledLink
                    href={item.href}
                    className={`relative flex items-center gap-2 px-4 py-2 text-base font-semibold transition-colors group rounded-md ${
                      (pathname === item.href && item.href === "/") ||
                      (item.href !== "/" && pathname.startsWith(item.href))
                        ? "text-white bg-white/5"
                        : "text-text-secondary hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.title}
                    {item.isDropdown && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${
                          openMenu === item.title ? "rotate-180" : ""
                        }`}
                      />
                    )}
                    {((pathname === item.href && item.href === "/") ||
                      (item.href !== "/" &&
                        pathname.startsWith(item.href))) && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--brand-accent)] rounded-full"></span>
                    )}
                  </StyledLink>
                  {item.isDropdown && (
                    <Transition
                      show={openMenu === item.title}
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-2"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-2"
                    >
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-auto">
                        <div className="bg-brand-secondary rounded-xl shadow-2xl border border-gray-700/50 p-4">
                          <div className="grid grid-flow-col auto-cols-max gap-4">
                            {(item.subLinks || []).map((subLink) => (
                              <StyledLink
                                key={subLink.name}
                                href={subLink.href}
                                className="group flex items-start gap-4 p-3 rounded-lg hover:bg-black/20 transition-colors w-72"
                              >
                                <div className="flex-shrink-0 bg-black/20 p-3 rounded-lg text-[var(--brand-accent)]">
                                  {subLink.icon && <subLink.icon size={24} />}
                                </div>
                                <div>
                                  <p className="font-bold text-white group-hover:text-[var(--brand-accent)] transition-colors">
                                    {subLink.name}
                                  </p>
                                  <p className="text-sm text-text-muted mt-1">
                                    {subLink.description}
                                  </p>
                                </div>
                              </StyledLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Transition>
                  )}
                </li>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-text-muted hover:text-white transition-colors"
            >
              <Search size={22} />
            </button>
            <div className="hidden md:block">
              <LanguageDropdown
                languages={languages}
                isLoading={isLoadingLanguages}
              />
            </div>
            <div className="flex lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
                className="p-2"
              >
                <Menu size={26} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <HeaderSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <MobileFlyoutMenu />
      <Suspense fallback={null}>
        <Ticker />
      </Suspense>
    </div>
  );
}
