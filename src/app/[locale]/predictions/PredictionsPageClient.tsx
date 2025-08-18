// ===== src/app/[locale]/predictions/PredictionsPageClient.tsx =====

"use client";

import { Fragment, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useInView } from "react-intersection-observer";
import { Loader2, ShieldQuestion } from "lucide-react";
import PredictionCard, {
  PredictionCardSkeleton,
} from "@/components/predictions/PredictionCard";
import { useTranslation } from "@/hooks/useTranslation";

// CHANGE: The expected structure from the API is now the enriched fixture from our database
interface EnrichedFixture {
  fixture: any;
  teams: any;
  league: any;
  prediction: {
    home: number;
    draw: number;
    away: number;
  };
  h2h: any[];
  form: {
    home: string | null;
    away: string | null;
  };
}

interface PredictionsApiResponse {
  fixtures: EnrichedFixture[];
  nextPage: number | null;
}

const fetchPredictions = async ({
  pageParam = 1,
}): Promise<PredictionsApiResponse> => {
  const { data } = await axios.get(
    `/api/predictions/upcoming?page=${pageParam}`
  );
  return data;
};

export default function PredictionsPageClient() {
  const { t } = useTranslation();
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["upcomingPredictions"],
    queryFn: fetchPredictions,
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <PredictionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (
    isError ||
    !data?.pages[0]?.fixtures ||
    data.pages[0].fixtures.length === 0
  ) {
    return (
      <div className="text-center py-20 bg-brand-secondary rounded-lg">
        <ShieldQuestion size={48} className="mx-auto text-brand-muted mb-4" />
        <p className="text-xl font-bold text-white">
          {t("no_predictions_found_title")}
        </p>
        <p className="text-brand-muted mt-2">
          {t("no_predictions_found_subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.pages.map((page, i) => (
          <Fragment key={i}>
            {page.fixtures.map((enrichedFixture) => (
              <PredictionCard
                key={enrichedFixture.fixture.id}
                fixture={enrichedFixture}
              />
            ))}
          </Fragment>
        ))}
      </div>

      <div ref={ref} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-brand-muted">
            <Loader2 size={24} className="animate-spin" />
            <span>{t("loading_more")}...</span>
          </div>
        )}
        {!isFetchingNextPage &&
          !hasNextPage &&
          data.pages[0].fixtures.length > 0 && (
            <p className="text-brand-muted">{t("no_more_predictions")}</p>
          )}
      </div>
    </div>
  );
}
