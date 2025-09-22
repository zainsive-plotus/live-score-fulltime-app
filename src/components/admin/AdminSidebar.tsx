// ===== src/components/admin/AdminSidebar.tsx =====

"use client";

import { useState, useEffect, ReactNode, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Image as ImageIcon,
  Sparkles,
  User,
  Crown,
  FileText,
  HelpCircle,
  FileStack,
  ChevronRight,
  AlertTriangle,
  Shield,
  UserCircle,
  DatabaseZap,
  Bot,
  Languages,
  Megaphone,
  FileJson,
  Trophy,
  Users as TeamsIcon,
  BrainCircuit,
  Link as LinkIcon,
  Send,
  FilePenLine,
  Share2,
  Server,
  Map,
  BookOpen,
  Target,
  LogOut,
  Settings,
  Database,
  Briefcase,
  Type,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

// --- Reusable Components for the Sidebar ---

interface NavItemProps {
  href: string;
  name: string;
  icon: React.ElementType;
  isActive: boolean;
}

const NavItem = ({ href, name, icon: Icon, isActive }: NavItemProps) => (
  <li>
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? "bg-brand-purple text-white"
          : "text-brand-muted hover:bg-gray-700 hover:text-white"
      }`}
    >
      <Icon size={20} />
      <span>{name}</span>
    </Link>
  </li>
);

interface CollapsibleNavGroupProps {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isActive: boolean;
  children: ReactNode;
}

const CollapsibleNavGroup = ({
  title,
  icon: Icon,
  isOpen,
  setIsOpen,
  isActive,
  children,
}: CollapsibleNavGroupProps) => (
  <li>
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? "bg-brand-purple text-white"
          : "text-brand-muted hover:bg-gray-700 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span>{title}</span>
      </div>
      <ChevronRight
        size={18}
        className={`transition-transform duration-300 ${
          isOpen ? "rotate-90" : ""
        }`}
      />
    </button>
    <div
      className={`grid transition-all duration-300 ease-in-out ${
        isOpen
          ? "grid-rows-[1fr] opacity-100 pt-1"
          : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <ul className="overflow-hidden space-y-1 pl-5 border-l-2 border-gray-700 ml-4">
        {children}
      </ul>
    </div>
  </li>
);

// --- Main Sidebar Component ---

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // --- State for each collapsible section ---
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // --- Configuration for the entire sidebar structure ---
  // This is the single source of truth for the sidebar layout.
  const navConfig = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    {
      name: "Content Management",
      icon: BookOpen,
      key: "content",
      children: [
        { name: "News & Posts", href: "/admin/news", icon: Newspaper },
        { name: "Curated News", href: "/admin/curated-news", icon: Bot },
        {
          name: "Site Pages & FAQs",
          key: "pages",
          children: [
            { name: "FAQs", href: "/admin/faqs", icon: HelpCircle },
            {
              name: "Author Page",
              href: "/admin/pages/author",
              icon: UserCircle,
            },
            {
              name: "Privacy Policy",
              href: "/admin/pages/privacy-policy",
              icon: Shield,
            },
            {
              name: "Terms & Conditions",
              href: "/admin/pages/terms-and-conditions",
              icon: FileText,
            },
            { name: "GDPR Page", href: "/admin/pages/gdpr", icon: DatabaseZap },
            {
              name: "Report Abuse",
              href: "/admin/pages/report-abuse",
              icon: AlertTriangle,
            },
          ],
        },
      ],
    },
    {
      name: "AI & Automation",
      icon: Sparkles,
      key: "ai",
      children: [
        {
          name: "Content Automation",
          href: "/admin/auto-news",
          icon: Sparkles,
        },
        {
          name: "SEO Content Engine",
          href: "/admin/seo-text",
          icon: FilePenLine,
        },
        {
          name: "SEO Overrides",
          href: "/admin/seo-overrides",
          icon: FilePenLine,
        },
        { name: "AI Journalists", href: "/admin/ai-journalists", icon: User },
        { name: "Title Templates", href: "/admin/title-templates", icon: Type },
      ],
    },
    {
      name: "Marketing & Growth",
      icon: Target,
      key: "marketing",
      children: [
        { name: "Ad Banners", href: "/admin/banners", icon: ImageIcon },
        {
          name: "Affiliate Partners",
          href: "/admin/casino-partners",
          icon: Crown,
        },
        { name: "Social Links", href: "/admin/social-links", icon: Share2 },
        {
          name: "Link Tracker",
          href: "/admin/link-tracker",
          icon: LinkIcon,
        },
        {
          name: "Referrer Tracker",
          href: "/admin/referrer-tracker",
          icon: Send,
        },
      ],
    },
    {
      name: "Data Management",
      icon: Database,
      key: "data",
      children: [
        { name: "Leagues", href: "/admin/leagues", icon: Trophy },
        { name: "Teams", href: "/admin/teams", icon: TeamsIcon },
        { name: "Predictions", href: "/admin/predictions", icon: BrainCircuit },
      ],
    },
    {
      name: "Site Settings",
      icon: Settings,
      key: "settings",
      children: [
        {
          name: "Ticker Messages",
          href: "/admin/ticker-messages",
          icon: Megaphone,
        },
        {
          name: "Localization",
          key: "localization",
          children: [
            { name: "Languages", href: "/admin/languages", icon: Languages },
            {
              name: "Translations",
              href: "/admin/translations",
              icon: FileJson,
            },
          ],
        },
      ],
    },
    {
      name: "System Tools",
      icon: Server,
      key: "system",
      children: [
        { name: "File Manager", href: "/admin/file-manager", icon: ImageIcon },
        { name: "Sitemap Generation", href: "/admin/sitemaps", icon: Map },
        {
          name: "Cache Management",
          href: "/admin/cache-management",
          icon: Server,
        },
      ],
    },
  ];

  // --- Logic to determine which sections are active and should be open by default ---
  const getActiveState = (items: any[]): Record<string, boolean> => {
    const activeState: Record<string, boolean> = {};
    const checkItems = (items: any[], parentIsActive = false) => {
      let anyChildActive = false;
      for (const item of items) {
        let isActive = false;
        if (item.children) {
          const isChildActive = checkItems(
            item.children,
            parentIsActive || isActive
          );
          isActive = isChildActive;
        } else {
          isActive = pathname.startsWith(item.href);
        }
        if (isActive && item.key) {
          activeState[item.key] = true;
          anyChildActive = true;
        }
      }
      return anyChildActive;
    };
    checkItems(navConfig);
    return activeState;
  };

  useEffect(() => {
    setOpenSections(getActiveState(navConfig));
  }, [pathname]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNav = (items: any[]) => {
    return items.map((item) => {
      const isActive = item.href
        ? pathname === item.href
        : openSections[item.key || ""];

      if (!item.children) {
        return <NavItem key={item.name} {...item} isActive={isActive} />;
      }

      return (
        <CollapsibleNavGroup
          key={item.name}
          title={item.name}
          icon={item.icon || FileStack}
          isOpen={!!openSections[item.key]}
          setIsOpen={() => toggleSection(item.key)}
          isActive={isActive}
        >
          {item.children.map((child: any) =>
            child.children ? (
              <CollapsibleNavGroup
                key={child.name}
                title={child.name}
                icon={child.icon || FileStack}
                isOpen={!!openSections[child.key]}
                setIsOpen={() => toggleSection(child.key)}
                isActive={openSections[child.key || ""]}
              >
                {child.children.map((subChild: any) => (
                  <SubNavItem
                    key={subChild.name}
                    href={subChild.href}
                    name={subChild.name}
                    icon={subChild.icon}
                    isActive={pathname.startsWith(subChild.href)}
                  />
                ))}
              </CollapsibleNavGroup>
            ) : (
              <SubNavItem
                key={child.name}
                href={child.href}
                name={child.name}
                icon={child.icon}
                isActive={pathname.startsWith(child.href)}
              />
            )
          )}
        </CollapsibleNavGroup>
      );
    });
  };

  const SubNavItem = ({ href, name, icon: Icon, isActive }: NavItemProps) => (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 p-2.5 rounded-md text-sm transition-colors ${
          isActive
            ? "text-white bg-brand-purple/50"
            : "text-brand-muted hover:text-white hover:bg-gray-700/50"
        }`}
      >
        <Icon size={16} />
        <span>{name}</span>
      </Link>
    </li>
  );

  return (
    <aside className="w-72 bg-brand-secondary h-screen sticky top-0 flex flex-col justify-between">
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        <div className="text-2xl font-bold text-white mb-8 px-3 pt-6 flex-shrink-0">
          Admin Panel
        </div>
        <nav className="flex-1 px-4">
          <ul className="space-y-1">{renderNav(navConfig)}</ul>
        </nav>
      </div>

      <div className="border-t border-gray-700 p-4 flex-shrink-0">
        {session?.user && (
          <div className="mb-4 text-brand-muted text-sm px-3">
            Logged in as{" "}
            <span className="font-semibold text-white">
              {session.user.name || session.user.email}
            </span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full text-left flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
