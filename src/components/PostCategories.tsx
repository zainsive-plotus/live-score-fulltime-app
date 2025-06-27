// src/components/PostCategories.tsx
"use client";

// Define the categories used in your news posts
export const NEWS_CATEGORIES = [
  "all",
  "football",
  "basketball",
  "tennis",
  "general",
];
export type NewsCategory =
  | "all"
  | "football"
  | "basketball"
  | "tennis"
  | "general";

interface PostCategoriesProps {
  activeCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
}

const categoryDisplayNames: { [key in NewsCategory]: string } = {
  all: "All News",
  football: "Football",
  basketball: "Basketball",
  tennis: "Tennis",
  general: "General",
};

export default function PostCategories({
  activeCategory,
  onCategoryChange,
}: PostCategoriesProps) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-brand-secondary overflow-x-auto scrollbar-hide mb-8">
      {NEWS_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category as NewsCategory)}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
            activeCategory === category
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-700/50"
          }`}
        >
          {categoryDisplayNames[category as NewsCategory]}
        </button>
      ))}
    </div>
  );
}
