// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Newspaper,
  Image,
  Sparkles,
  User,
  Crown,
  FileText, // <-- NEW ICON FOR FILE MANAGER
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const navItems = [
    {
      name: t("dashboard"),
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t("manage_news"),
      href: "/admin/news",
      icon: Newspaper,
    },
    {
      name: "Automated News",
      href: "/admin/auto-news",
      icon: Sparkles,
    },
    {
      name: "AI Journalists",
      href: "/admin/ai-journalists",
      icon: User,
    },
    {
      name: "Casino Partners",
      href: "/admin/casino-partners",
      icon: Crown,
    },
    {
      name: "File Manager", // <-- NEW ITEM
      href: "/admin/file-manager", // <-- NEW PATH
      icon: FileText, // <-- NEW ICON
    },
    {
      name: t("manage_banners"),
      href: "/admin/banners",
      icon: Image,
    },
    // { name: t('manage_users'), href: '/admin/users', icon: Users },
    // { name: t('manage_matches'), href: '/admin/matches', icon: Calendar },
  ];

  return (
    <aside className="w-72 bg-brand-secondary h-screen sticky top-0 p-6 flex flex-col justify-between">
      <div>
        <div className="text-2xl font-bold text-white mb-8">Admin Panel</div>
        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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
        </nav>
      </div>

      <div className="border-t border-gray-700 pt-6">
        {session?.user && (
          <div className="mb-4 text-brand-muted text-sm">
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
          <span>{t("sign_out")}</span>
        </button>
      </div>
    </aside>
  );
}
