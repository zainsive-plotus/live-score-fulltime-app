// ===== src/components/MatchDateRangeNavigator.tsx =====

"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  Locale,
  isEqual,
} from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Popover, Transition } from "@headlessui/react";

import { enUS, tr, fr, es } from "date-fns/locale";

interface DateRangeNavigatorProps {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
}

const dateLocales: Record<string, Locale> = { en: enUS, tr, fr, es };

const presetRanges = (t: (key: string) => string) => {
  const today = new Date();
  return [
    {
      label: t("yesterday"),
      range: { from: subDays(today, 1), to: subDays(today, 1) },
    },
    { label: t("today"), range: { from: today, to: today } },
    {
      label: t("tomorrow"),
      range: { from: addDays(today, 1), to: addDays(today, 1) },
    },
    {
      label: t("last_week"),
      range: {
        from: startOfWeek(subDays(today, 7)),
        to: endOfWeek(subDays(today, 7)),
      },
    },
    {
      label: t("next_week"),
      range: {
        from: startOfWeek(addDays(today, 7)),
        to: endOfWeek(addDays(today, 7)),
      },
    },
  ];
};

export default function MatchDateRangeNavigator({
  range,
  onRangeChange,
}: DateRangeNavigatorProps) {
  const { t, locale } = useTranslation();
  // Local state to manage the selection within the popover before applying
  const [localRange, setLocalRange] = useState<DateRange | undefined>(range);

  // Sync local state when the popover opens or the external prop changes
  useEffect(() => {
    setLocalRange(range);
  }, [range]);

  const handleApply = (close: () => void) => {
    onRangeChange(localRange);
    close();
  };

  const handleCancel = (close: () => void) => {
    setLocalRange(range); // Revert to the original range
    close();
  };

  const currentLocale = dateLocales[locale] || enUS;

  const displayLabel = () => {
    if (range?.from && range.to) {
      if (isEqual(range.from, range.to)) {
        return format(range.from, "d MMMM yyyy", { locale: currentLocale });
      }
      return `${format(range.from, "d MMM", {
        locale: currentLocale,
      })} - ${format(range.to, "d MMM, yyyy", { locale: currentLocale })}`;
    }
    return t("select_date_range");
  };

  const isPresetActive = (presetRange: DateRange) => {
    if (!localRange?.from || !localRange.to) return false;
    return (
      isEqual(localRange.from, presetRange.from!) &&
      isEqual(localRange.to, presetRange.to!)
    );
  };

  return (
    <Popover className="relative w-ful">
      {({ open, close }) => (
        <>
          <Popover.Button
            className="flex items-center justify-center gap-2 w-full text-lg font-bold p-2 rounded-md hover:bg-[var(--brand-accent)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-[var(--brand-accent)] "
            aria-expanded={open}
          >
            <CalendarIcon size={20} className="text-gray-400" />
            <span className="text-white capitalize">{displayLabel()}</span>
          </Popover.Button>

          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute top-full right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 mt-2 bg-[var(--color-primary)] border border-gray-700/50 rounded-lg shadow-2xl z-20 w-[95vw] max-w-[620px] ">
              <div className="flex flex-col md:flex-row">
                {/* Presets Column */}
                <div className="p-4 border-b md:border-b-0 md:border-r border-gray-700/50 flex-shrink-0 w-full md:w-40">
                  <h4 className="font-bold text-white text-sm mb-2 px-2">
                    Date Ranges
                  </h4>
                  <div className="flex flex-row flex-wrap md:flex-col items-start gap-1">
                    {presetRanges(t).map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setLocalRange(preset.range)}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                          isPresetActive(preset.range)
                            ? "bg-[var(--brand-accent)] text-white"
                            : "text-gray-200 hover:bg-white/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Calendar Column */}
                <div className="flex-grow">
                  <DayPicker
                    mode="range"
                    selected={localRange}
                    onSelect={setLocalRange}
                    locale={currentLocale}
                    numberOfMonths={2}
                    defaultMonth={localRange?.from || new Date()}
                    styles={{
                      day: { transition: "background-color 0.2s" },
                    }}
                    modifiersStyles={{
                      selected: {
                        backgroundColor: "#ed5c19",
                        color: "white",
                        fontWeight: "bold",
                      },
                      range_middle: {
                        backgroundColor: "rgba(237, 92, 25, 0.2)",
                        borderRadius: 0,
                      },
                      range_start: {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                      range_end: {
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      },
                      today: { borderColor: "#ed5c19", borderWidth: "2px" },
                    }}
                    classNames={{
                      root: "p-3",
                      caption: "flex justify-center items-center mb-2 relative",
                      caption_label: "text-sm font-bold text-white",
                      nav_button:
                        "h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-700",
                      table: "border-collapse",
                      head_cell: "w-9 h-9 font-semibold text-gray-400 text-xs",
                      cell: "text-center",
                      day: "h-9 w-9 text-white rounded-md hover:bg-[var(--brand-accent)]/60",
                      day_outside: "text-gray-600",
                    }}
                  />
                </div>
              </div>
              {/* Footer with Apply/Cancel */}
              <div className="flex justify-end items-center gap-3 p-3 border-t border-gray-700/50 bg-brand-secondary/30 rounded-b-lg">
                <button
                  onClick={() => handleCancel(close)}
                  className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApply(close)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[var(--brand-accent)] hover:opacity-90 rounded-md"
                >
                  Apply
                </button>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
