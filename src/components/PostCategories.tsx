// src/components/PostCategories.tsx
"use client";

import React from "react";

// Define the categories for news articles
export type NewsCategory =
  | "all"
  | "trending" // Functional alias for "all" for display purposes
  | "football"
  | "basketball"
  | "tennis"
  | "general"
  | "prediction"
  | "match_reports";

interface PostCategoriesProps {
  activeCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
}

const categories: { value: NewsCategory; label: string }[] = [
  { value: "all", label: "All News" },
  { value: "trending", label: "Trending News" }, // Displayed as a tab
  { value: "prediction", label: "Prediction" },
  { value: "match_reports", label: "Match Reports" },
];

const PostCategories: React.FC<PostCategoriesProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  // Map "trending" to "all" internally for logic, but keep "trending" for display
  const effectiveActiveCategory =
    activeCategory === "trending" ? "all" : activeCategory;

  const handleClick = (category: NewsCategory) => {
    onCategoryChange(category);
  };

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {categories.map((category) => {
        // Determine if this tab should be active.
        // If the category is "trending", it's active if activeCategory is "trending".
        // Otherwise, it's active if effectiveActiveCategory matches the category's value.
        const isActive =
          (category.value === "trending" && activeCategory === "trending") ||
          (category.value !== "trending" &&
            effectiveActiveCategory === category.value);

        return (
          <button
            key={category.value}
            onClick={() => handleClick(category.value)}
            className={`
              px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ease-in-out
              ${
                isActive
                  ? "bg-brand-purple text-white border border-brand-purple" // Active state
                  : "bg-transparent text-white border border-white hover:bg-white/10" // Inactive state with white border and text
              }
            `}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
};

export default PostCategories;
