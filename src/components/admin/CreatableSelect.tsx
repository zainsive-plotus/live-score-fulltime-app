// src/components/admin/CreatableSelect.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchCategories = async (): Promise<string[]> => {
  const { data } = await axios.get("/api/admin/faqs/categories");
  return data;
};

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CreatableSelect({
  value,
  onChange,
  placeholder,
}: CreatableSelectProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  const { data: categories } = useQuery<string[]>({
    queryKey: ["faqCategories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredCategories =
    categories?.filter((category) =>
      category.toLowerCase().includes(inputValue.toLowerCase())
    ) || [];

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      setIsDropdownOpen(false); // Close dropdown
      inputRef.current?.blur(); // Unfocus the input
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        ref={inputRef} // Assign the ref
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsDropdownOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
      />

      {isDropdownOpen && (
        <div className="absolute top-full mt-1 w-full bg-brand-dark border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div
                key={category}
                onClick={() => handleSelect(category)}
                className="p-3 text-white hover:bg-brand-purple cursor-pointer"
              >
                {category}
              </div>
            ))
          ) : (
            <div className="p-3 text-brand-muted">
              {inputValue
                ? `Create new category: "${inputValue}"`
                : "No categories found."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
