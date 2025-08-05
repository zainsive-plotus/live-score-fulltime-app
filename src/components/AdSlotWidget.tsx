// ===== src/components/AdSlotWidget.tsx =====
"use client"; // Revert to a Client Component

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { IBanner } from "@/models/Banner";

interface AdSlotWidgetProps {
  location: string;
  initialBanner?: IBanner | null; // Optional prop for server-fetched data
}

// Client-side fetching function
const fetchBannerForSlot = async (
  location: string
): Promise<IBanner | null> => {
  try {
    const { data } = await axios.get(
      `/api/banners?location=${location}&active=true`
    );
    return data?.[0] || null;
  } catch (error) {
    console.error(
      `[AdSlotWidget] Client fetch failed for location "${location}":`,
      error
    );
    return null;
  }
};

const AdBannerSkeleton = () => (
  <div className="w-full h-[250px] bg-brand-secondary rounded-lg animate-pulse"></div>
);

export default function AdSlotWidget({
  location,
  initialBanner,
}: AdSlotWidgetProps) {
  const {
    data: banner,
    isLoading,
    isError,
  } = useQuery<IBanner | null>({
    queryKey: ["banner", location],
    queryFn: () => fetchBannerForSlot(location),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    // Use the server-fetched data if available, otherwise fetch on client
    initialData: initialBanner,
    // Only enable client-side fetching if no initial data is provided
    enabled: !initialBanner,
  });

  const finalBanner = initialBanner ?? banner;

  if (isLoading && !initialBanner) {
    return <AdBannerSkeleton />;
  }

  if (isError || !finalBanner) {
    return null;
  }

  return (
    <div className="w-full">
      <Link
        href={finalBanner.linkUrl}
        target="_blank"
        rel="noopener sponsored"
        className="relative block w-full overflow-hidden rounded-lg group"
        aria-label={`Advertisement: ${finalBanner.title}`}
      >
        <Image
          src={finalBanner.imageUrl}
          alt={finalBanner.title}
          width={300}
          height={250}
          unoptimized={true}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 p-2 w-full bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-sm font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {finalBanner.title}
          </p>
          <span className="text-xs text-gray-300 drop-shadow-md">
            Advertisement
          </span>
        </div>
      </Link>
    </div>
  );
}
