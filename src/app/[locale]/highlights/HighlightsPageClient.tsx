// ===== src/app/[locale]/highlights/HighlightsPageClient.tsx =====

"use client";

import { Fragment, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useInView } from "react-intersection-observer";
import { Loader2, VideoOff } from "lucide-react";
import HighlightCard, {
  HighlightCardSkeleton,
} from "@/components/HighlightCard";
import { useTranslation } from "@/hooks/useTranslation";

interface Highlight {
  id: string;
  title: string;
  thumbnailUrl: string;
  embedUrl: string;
  source: "Highlightly" | "YouTube";
  publishedAt: string;
}

interface HighlightsApiResponse {
  highlights: Highlight[];
  nextPage: number | null;
}

const fetchHighlights = async ({
  pageParam = 1,
}): Promise<HighlightsApiResponse> => {
  const { data } = await axios.get(
    `/api/highlights/aggregate?page=${pageParam}`
  );
  return data;
};

export default function HighlightsPageClient() {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["aggregatedHighlights"],
    queryFn: fetchHighlights,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <HighlightCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (
    isError ||
    !data?.pages[0]?.highlights ||
    data.pages[0].highlights.length === 0
  ) {
    return (
      <div className="text-center py-20 bg-brand-secondary rounded-lg">
        <VideoOff size={48} className="mx-auto text-brand-muted mb-4" />
        <p className="text-xl font-bold text-white">
          {t("no_highlights_found_title")}
        </p>
        <p className="text-brand-muted mt-2">
          {t("no_highlights_found_subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.pages.map((page, i) => (
          <Fragment key={i}>
            {page.highlights.map((highlight) => (
              <HighlightCard key={highlight.id} highlight={highlight} />
            ))}
          </Fragment>
        ))}
      </div>

      <div ref={ref} className="h-20 flex items-center justify-center">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-brand-muted">
            <Loader2 size={24} className="animate-spin" />
            <span>{t("loading_more")}...</span>
          </div>
        ) : !hasNextPage ? (
          <p className="text-brand-muted">{t("no_more_highlights")}</p>
        ) : null}
      </div>
    </div>
  );
}
