// ===== src/components/AdSlotWidget.tsx (CORRECTED) =====
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { IBanner } from "@/models/Banner";
import { proxyImageUrl } from "@/lib/image-proxy";

interface AdSlotWidgetProps {
  location: string;
}

// Fetch a single, active banner for a specific location
const fetchBannerForSlot = async (
  location: string
): Promise<IBanner | null> => {
  try {
    const { data } = await axios.get(
      `/api/banners?location=${location}&active=true`
    );
    // The API returns an array, we only want the first one for a single slot
    return data?.[0] || null;
  } catch (error) {
    console.error(`Failed to fetch banner for location: ${location}`, error);
    return null;
  }
};

const AdBannerSkeleton = () => (
  <div className="w-full h-[250px] bg-brand-secondary rounded-lg animate-pulse"></div>
);

export default function AdSlotWidget({ location }: AdSlotWidgetProps) {
  const {
    data: banner,
    isLoading,
    isError,
  } = useQuery<IBanner | null>({
    queryKey: ["banner", location],
    queryFn: () => fetchBannerForSlot(location),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Banners don't need to be refetched so often
  });

  if (isLoading) {
    return <AdBannerSkeleton />;
  }

  if (isError || !banner) {
    // Don't render anything if there's an error or no banner for this slot
    return null;
  }

  return (
    <div className="w-full">
      <Link
        href={banner.linkUrl}
        target="_blank"
        rel="noopener sponsored"
        className="relative block w-full overflow-hidden rounded-lg group"
        aria-label={`Advertisement: ${banner.title}`}
      >
        <Image
          src={proxyImageUrl(banner.imageUrl)}
          alt={banner.title}
          width={300}
          height={250}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* The div that created the dark gradient overlay has been removed. */}

        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h3 className="text-lg font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {banner.title}
          </h3>
          <span className="text-xs text-gray-300 drop-shadow-md">
            Advertisement
          </span>
        </div>
      </Link>
    </div>
  );
}
