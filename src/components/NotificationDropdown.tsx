"use client";

import NotificationList from "./NotificationList";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const { t } = useTranslation(); // <-- Use hook

  return (
    <div
      className="fixed top-28 left-1/2 -translate-x-1/2 w-[90vw] max-w-sm
                 md:absolute md:top-full md:left-auto md:right-0 md:translate-x-0 md:w-96
                 bg-brand-secondary rounded-xl shadow-2xl border border-gray-700/50 z-[100] animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="font-bold text-lg text-white">{t("notifications")}</h3>{" "}
        {/* <-- Translate title */}
      </div>
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
        <NotificationList onItemClick={onClose} />
      </div>
      <div className="p-2 border-t border-gray-700/50 text-center">
        <Link
          href="/football/news"
          onClick={onClose}
          className="text-sm font-semibold text-brand-purple hover:underline flex items-center justify-center gap-1"
        >
          {t("view_all_news")} <ArrowRight size={14} />{" "}
          {/* <-- Translate link */}
        </Link>
      </div>
    </div>
  );
}
