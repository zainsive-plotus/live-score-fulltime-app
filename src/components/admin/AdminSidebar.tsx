// ===== src/components/admin/AdminSidebar.tsx =====

"use client";

import { useState, useEffect } from "react";
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
  Type,
  Bot,
  Languages,
  Megaphone,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const SubNavItem = ({
  href,
  name,
  icon: Icon,
  isActive,
}: {
  href: string;
  name: string;
  icon: React.ElementType;
  isActive: boolean;
}) => (
  <li>
    <Link
      href={href}
      className={`flex items-center gap-3 p-2 pl-4 rounded-md text-sm transition-colors ${
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

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAiSectionActive =
    pathname.startsWith("/admin/auto-news") ||
    pathname.startsWith("/admin/ai-journalists") ||
    pathname.startsWith("/admin/title-templates") ||
    pathname.startsWith("/admin/curated-news"); // <-- Add new page to condition

  const isPagesSectionActive =
    pathname.startsWith("/admin/faqs") || pathname.startsWith("/admin/pages");

  const [isAiOpen, setIsAiOpen] = useState(isAiSectionActive);
  const [isPagesOpen, setIsPagesOpen] = useState(isPagesSectionActive);

  useEffect(() => {
    setIsAiOpen(isAiSectionActive);
  }, [isAiSectionActive]);

  useEffect(() => {
    setIsPagesOpen(isPagesSectionActive);
  }, [isPagesSectionActive]);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "News", href: "/admin/news", icon: Newspaper },
    { name: "Languages", href: "/admin/languages", icon: Languages },
    { name: "Ticker Messages", href: "/admin/ticker-messages", icon: Megaphone },
    { name: "Casino Partners", href: "/admin/casino-partners", icon: Crown },
    { name: "File Manager", href: "/admin/file-manager", icon: FileText },
    { name: "Banners", href: "/admin/banners", icon: ImageIcon },
  ];
  
  // --- Start of Change ---
  // Added "Curated News" to the AI sub-navigation
  const aiSubNav = [
    { name: "Automation Log", href: "/admin/auto-news", icon: Sparkles },
    { name: "Curated News", href: "/admin/curated-news", icon: Bot },
    { name: "AI Journalists", href: "/admin/ai-journalists", icon: User },
    { name: "Title Templates", href: "/admin/title-templates", icon: Type },
  ];
  // --- End of Change ---

  const pagesSubNav = [
    { name: "FAQs", href: "/admin/faqs", icon: HelpCircle },
    {
      name: "Report Abuse",
      href: "/admin/pages/report-abuse",
      icon: AlertTriangle,
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
    { name: "Author Page", href: "/admin/pages/author", icon: UserCircle },
    { name: "GDPR Page", href: "/admin/pages/gdpr", icon: DatabaseZap },
  ];

  return (
    <aside className="w-72 bg-brand-secondary h-screen sticky top-0 p-4 flex flex-col justify-between">
      <div>
        <div className="text-2xl font-bold text-white mb-8 px-2">
          Admin Panel
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-brand-purple text-white"
                    : "text-brand-muted hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div>
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                isAiSectionActive
                  ? "bg-brand-purple text-white"
                  : "text-brand-muted hover:bg-gray-700 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot size={20} />
                <span>AI Content Engine</span>
              </div>
              <ChevronRight
                size={18}
                className={`transition-transform duration-300 ${
                  isAiOpen ? "rotate-90" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isAiOpen
                  ? "grid-rows-[1fr] opacity-100 pt-1"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <ul className="overflow-hidden space-y-1 pl-4">
                {aiSubNav.map((item) => (
                  <SubNavItem
                    key={item.name}
                    href={item.href}
                    name={item.name}
                    icon={item.icon}
                    isActive={pathname.startsWith(item.href)}
                  />
                ))}
              </ul>
            </div>
          </div>

          <div>
            <button
              onClick={() => setIsPagesOpen(!isPagesOpen)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                isPagesSectionActive
                  ? "bg-brand-purple text-white"
                  : "text-brand-muted hover:bg-gray-700 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileStack size={20} />
                <span>Pages & FAQs</span>
              </div>
              <ChevronRight
                size={18}
                className={`transition-transform duration-300 ${
                  isPagesOpen ? "rotate-90" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isPagesOpen
                  ? "grid-rows-[1fr] opacity-100 pt-1"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <ul className="overflow-hidden space-y-1 pl-4">
                {pagesSubNav.map((item) => (
                  <SubNavItem
                    key={item.name}
                    href={item.href}
                    name={item.name}
                    icon={item.icon}
                    isActive={pathname.startsWith(item.href)}
                  />
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>

      <div className="border-t border-gray-700 pt-4">
        {session?.user && (
          <div className="mb-4 text-brand-muted text-sm px-3">
            Logged in as{" "}
            <span className="font-semibold text-white">
              {session.user.name || session.user.email}
            </span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-log-out"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="17 16 22 12 17 8" />
            <line x1="22" x2="10" y1="12" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}