// ===== src/components/LatestHighlightsWidget.tsx =====
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Film, ArrowRight } from "lucide-react";
import HighlightCard, { HighlightCardSkeleton } from "./HighlightCard";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "./StyledLink";

interface Highlight {
  id: string;
  embedUrl: string;
  title: string;
  // Add other properties if they exist on your highlight object
  [key: string]: any;
}

const fetchLatestHighlights = async (): Promise<Highlight[] | null> => {
  try {
    // Fetch 6 items for our grid display
    const { data } = await axios.get("/api/highlights/latest?limit=6");
    return data?.highlights || null;
  } catch (error) {
    console.error(
      "[LatestHighlightsWidget] Failed to fetch highlights:",
      error
    );
    return null;
  }
};

const WidgetSkeleton = () => (
  <div>
    <div className="h-8 w-2/3 bg-gray-700 rounded-md mb-4 animate-pulse"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <HighlightCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default function LatestHighlightsWidget() {
  const { t } = useTranslation();
  const {
    data: highlights,
    isLoading,
    isError,
  } = useQuery<Highlight[] | null>({
    queryKey: ["latestHighlightsWidgetGrid"], // Use a new query key
    queryFn: fetchLatestHighlights,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  if (isError || (!isLoading && (!highlights || highlights.length === 0))) {
    return null; // Don't render anything if there's an error or no data
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Film size={22} className="text-brand-purple" />
          {t("recent_highlights")}
        </h2>
        <StyledLink
          href="/highlights"
          className="flex items-center gap-1 text-sm font-semibold text-text-muted transition-colors hover:text-white"
        >
          {t("view_more")}
          <ArrowRight size={14} />
        </StyledLink>
      </div>

      {isLoading ? (
        <WidgetSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights?.map((highlight) => (
            <HighlightCard key={highlight.id} highlight={highlight} />
          ))}
        </div>
      )}
    </section>
  );
}
