"use client";

import { useState, useRef, useEffect } from "react";
import { format, addDays, subDays, isToday, Locale } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
// Import date-fns locales for different languages
import { enUS, tr, fr, es } from "date-fns/locale";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const dateLocales: Record<string, Locale> = { en: enUS, tr,  fr, es, };

export default function MatchDateNavigator({
  selectedDate,
  onDateChange,
}: DateNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsOpen(false);
    }
  };

  const handleTodayClick = () => {
    onDateChange(new Date());
    setIsOpen(false);
  };

  const currentLocale = dateLocales[locale] || enUS;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center justify-between rounded-lg p-2 bg-brand-secondary">
        <button
          onClick={handleTodayClick}
          disabled={isToday(selectedDate)}
          className="px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-brand-purple/80 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label="Go to today's date"
        >
          {t("today")}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDateChange(subDays(selectedDate, 1))}
            className="p-2 transition-colors hover:bg-gray-700/50 rounded-full"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-700/50 transition-colors"
            aria-expanded={isOpen}
          >
            <CalendarIcon size={18} className="text-text-muted" />
            <span className="font-bold text-lg text-white capitalize">
              {format(selectedDate, "d MMMM", { locale: currentLocale })}
            </span>
          </button>

          <button
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            className="p-2 transition-colors hover:bg-gray-700/50 rounded-full"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="w-[84px]"></div>
      </div>

      <div
        className={`absolute top-full right-0 mt-2 bg-brand-secondary border border-gray-700/50 rounded-lg shadow-2xl z-20
                   transition-all duration-200 ease-out
                   ${
                     isOpen
                       ? "opacity-100 translate-y-0"
                       : "opacity-0 -translate-y-2 pointer-events-none"
                   }`}
      >
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
          initialFocus
          locale={currentLocale}
          classNames={{
            root: "p-3",
            caption: "flex justify-between items-center mb-4",
            caption_label: "text-base font-bold text-white capitalize",
            nav_button:
              "h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors",
            head_row: "flex",
            head_cell:
              "w-10 h-10 flex items-center justify-center font-semibold text-brand-muted text-sm",
            row: "flex w-full mt-2",
            cell: "flex items-center justify-center",
            day: "h-10 w-10 text-white rounded-full hover:bg-brand-purple/60 transition-colors cursor-pointer",
            day_selected:
              "bg-brand-purple text-white font-bold hover:bg-brand-purple",
            day_today:
              "ring-2 ring-brand-purple ring-offset-2 ring-offset-brand-secondary",
            day_outside: "text-brand-muted/40 cursor-default",
            day_disabled: "text-brand-muted/40 cursor-not-allowed",
          }}
        />
      </div>
    </div>
  );
}
