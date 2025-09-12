// ===== src/components/team/TeamHighlightsTab.tsx =====

"use client";

import { useTranslation } from "@/hooks/useTranslation";
import HighlightCard, {
  HighlightCardSkeleton,
} from "@/components/HighlightCard";
import { Info } from "lucide-react";

interface TeamHighlightsTabProps {
  highlights: any[] | null;
  isLoading?: boolean; // Optional loading prop for suspense
}

export default function TeamHighlightsTab({
  highlights,
  isLoading,
}: TeamHighlightsTabProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <HighlightCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!highlights) {
    return (
      <div className="p-8 text-center text-red-400 bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("error_loading_highlights")}</p>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="p-8 text-center text-brand-muted bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("no_highlights_found")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
      {highlights.map((highlight) => (
        <HighlightCard key={highlight.id} highlight={highlight} />
      ))}
    </div>
  );
}

// Add these new translation keys:
// "error_loading_highlights": "Could not load highlight data.",
// "no_highlights_found": "No recent highlights were found for this team."
