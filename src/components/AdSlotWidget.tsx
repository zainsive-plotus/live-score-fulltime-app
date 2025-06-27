// src/components/AdSlotWidget.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import { IBanner } from "@/models/Banner";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowRight } from "lucide-react";

interface AdSlotWidgetProps {
  location: string;
}

const fetchActiveBanners = async (location: string): Promise<IBanner[]> => {
  const { data } = await axios.get(
    `/api/banners?active=true&location=${location}`
  );
  return data;
};

const AdSlotSkeleton = () => (
  <div className="bg-brand-secondary p-4 rounded-lg animate-pulse">
    <div className="h-5 w-1/2 mb-4 bg-gray-700 rounded"></div>
    <div className="relative aspect-video w-full rounded-lg bg-gray-700"></div>
  </div>
);

export default function AdSlotWidget({ location }: AdSlotWidgetProps) {
  const {
    data: banners,
    isLoading,
    error,
  } = useQuery<IBanner[]>({
    queryKey: ["activeBanners", location],
    queryFn: () => fetchActiveBanners(location),
    staleTime: 5 * 60 * 1000,
    enabled: !!location,
  });

  const { t } = useTranslation();

  const randomAd = useMemo(() => {
    if (!banners || banners?.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * banners.length);
    return banners[randomIndex];
  }, [banners]);

  if (isLoading) return <AdSlotSkeleton />;
  if (error || !randomAd) return null;

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-3">
        {t("advertisement")}
      </h3>

      <a
        href={randomAd.linkUrl}
        target="_blank"
        rel="noopener sponsored"
        title={randomAd.title}
        className="block group rounded-lg overflow-hidden relative"
      >
        <img
          src={randomAd.imageUrl}
          alt={randomAd.title}
          className="w-full h-auto block transition-transform duration-500 ease-in-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0 pr-4">
              {/* --- THIS IS THE FIX --- */}
              {/* Added the `truncate` class to prevent the text from wrapping and overflowing. */}
              <h4 className="font-bold text-lg text-white leading-tight drop-shadow-md truncate">
                {randomAd.title}
              </h4>
            </div>

            <div className="flex-shrink-0 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white font-semibold text-sm rounded-md shadow-lg">
                <span>View</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
