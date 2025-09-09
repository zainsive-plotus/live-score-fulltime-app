// ===== src/components/admin/KeywordInput.tsx =====

"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface KeywordInputProps {
  keywords: string[];
  setKeywords: (keywords: string[]) => void;
  placeholder: string;
  label: string;
}

export default function KeywordInput({
  keywords,
  setKeywords,
  placeholder,
  label,
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newKeyword = inputValue.trim();
      if (newKeyword && !keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword]);
      }
      setInputValue("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-brand-light mb-1">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 p-2 bg-brand-dark rounded-md border border-gray-600">
        {keywords.map((keyword) => (
          <div
            key={keyword}
            className="flex items-center gap-1.5 bg-brand-secondary text-white text-sm font-semibold px-2 py-1 rounded"
          >
            <span>{keyword}</span>
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-grow bg-transparent text-white outline-none text-sm p-1"
        />
      </div>
    </div>
  );
}
