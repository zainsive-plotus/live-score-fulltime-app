"use client";

import { useEffect, Fragment } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useInView } from "react-intersection-observer";
import { useTranslation } from "@/hooks/useTranslation";
import HighlightCard, {
  HighlightCardSkeleton,
} from "@/components/HighlightCard";
import { Info, Loader2 } from "lucide-react";

interface Highlight {
  id: number;
  [key: string]: any;
}

interface HighlightsApiResponse {
  highlights: Highlight[];
  nextPage: number | null;
}

const fetchTeamHighlights = async (
  teamName: string,
  pageParam = 1
): Promise<HighlightsApiResponse> => {
  const params = new URLSearchParams({
    teamName,
    page: pageParam.toString(),
    limit: "9",
  });
  const { data } = await axios.get(
    `/api/highlights/aggregate?${params.toString()}`
  );
  return data;
};

interface TeamHighlightsTabProps {
  initialHighlights: Highlight[] | null;
  teamName: string;
}

export default function TeamHighlightsTab({
  initialHighlights,
  teamName,
}: TeamHighlightsTabProps) {
  const { t } = useTranslation();
  const { ref, inView } = useInView({ threshold: 0.5 });

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["teamHighlights", teamName],
    queryFn: ({ pageParam = 1 }) => fetchTeamHighlights(teamName, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialData: () => {
      if (initialHighlights && initialHighlights.length > 0) {
        // Assume if we have initial data, the next page is 2
        return {
          pages: [{ highlights: initialHighlights, nextPage: 2 }],
          pageParams: [1],
        };
      }
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <HighlightCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-400 bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("error_loading_highlights")}</p>
      </div>
    );
  }

  const allHighlights = data?.pages.flatMap((page) => page.highlights);

  if (!allHighlights || allHighlights.length === 0) {
    return (
      <div className="p-8 text-center text-brand-muted bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("no_highlights_found")}</p>
      </div>
    );
  }

  return (
    <div className="p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allHighlights.map((highlight) => (
          <HighlightCard key={highlight.id} highlight={highlight} />
        ))}
      </div>

      <div ref={ref} className="h-20 flex items-center justify-center">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-brand-muted">
            <Loader2 size={24} className="animate-spin" />
            <span>{t("loading_more")}...</span>
          </div>
        ) : !hasNextPage ? (
          <p className="text-brand-muted text-sm">{t("no_more_highlights")}</p>
        ) : null}
      </div>
    </div>
  );
}
