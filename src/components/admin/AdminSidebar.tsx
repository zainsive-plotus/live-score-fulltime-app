// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  BarChart,
  ImageIcon,
} from "lucide-react"; // Added ImageIcon

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/news", label: "Manage News", icon: Newspaper },
  { href: "/admin/banners", label: "Manage Banners", icon: ImageIcon }, // New Item
  { href: "/admin/users", label: "Manage Users", icon: Users, disabled: true },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart,
    disabled: true,
  },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-brand-secondary p-6 flex-shrink-0">
      <h2 className="text-2xl font-bold text-white mb-8">Admin Panel</h2>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-brand-purple text-white"
                    : "text-brand-light hover:bg-gray-700/50"
                }
                ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
