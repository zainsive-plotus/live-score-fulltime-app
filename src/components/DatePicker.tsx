// src/components/DatePicker.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';
import 'react-day-picker/dist/style.css'; // Import the default styles

interface DatePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export default function DatePicker({ date, setDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the popover if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleDaySelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 w-full min-w-[280px] text-lg font-bold p-2 rounded-md hover:bg-brand-purple"
      >
        <CalendarIcon size={20} />
        <span>{format(date, 'eeee, dd MMMM yyyy')}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 bg-brand-secondary border border-gray-600 rounded-lg shadow-lg z-20 p-2">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            initialFocus
            // Add custom styles for dark mode
            classNames={{
              caption: 'flex justify-center py-2 mb-4 relative items-center',
              caption_label: 'text-sm font-medium text-white',
              nav: 'flex items-center',
              nav_button: 'h-6 w-6 bg-transparent hover:bg-brand-purple p-1 rounded-md',
              nav_button_previous: 'absolute left-1.5',
              nav_button_next: 'absolute right-1.5',
              table: 'w-full border-collapse',
              head_row: 'flex font-medium text-brand-muted',
              head_cell: 'w-full p-2',
              row: 'flex w-full mt-2',
              cell: 'text-white',
              day: 'h-8 w-8 p-0 hover:bg-brand-purple rounded-md',
              day_selected: 'bg-brand-purple font-bold',
              day_today: 'bg-gray-700 rounded-md',
              day_outside: 'text-brand-muted opacity-50',
              day_disabled: 'text-brand-muted opacity-50 cursor-not-allowed',
            }}
          />
        </div>
      )}
    </div>
  );
}