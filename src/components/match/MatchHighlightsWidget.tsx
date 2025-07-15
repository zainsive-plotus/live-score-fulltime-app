"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Slider from "react-slick";
import { Film, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import HighlightSlide from "../HighlightSlide"; // <-- Import the simple slide component

// Import slick CSS directly for stability
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Interface must match the properties needed by HighlightSlide
interface Highlight {
  id: string;
  embedUrl: string;
  title: string;
}

interface MatchHighlightsWidgetProps {
  fixtureId: string;
}

const fetchHighlights = async (
  fixtureId: string
): Promise<Highlight[] | null> => {
  try {
    const { data } = await axios.get(`/api/highlights?fixtureId=${fixtureId}`);
    return data?.highlights || data || null;
  } catch (error) {
    return null;
  }
};

// --- Custom Arrow Components (copied from reference) ---
const NextArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute top-1/2 -right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/70 transition-colors transform -translate-y-1/2"
    aria-label="Next slide"
  >
    <ChevronRight size={24} />
  </button>
);
const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute top-1/2 -left-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/70 transition-colors transform -translate-y-1/2"
    aria-label="Previous slide"
  >
    <ChevronLeft size={24} />
  </button>
);

const SliderSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-1/3 bg-gray-700 rounded mb-4"></div>
    <div className="aspect-video w-full rounded-lg bg-gray-700/50"></div>
  </div>
);

export default function MatchHighlightsWidget({
  fixtureId,
}: MatchHighlightsWidgetProps) {
  const { t } = useTranslation();

  const {
    data: highlights,
    isLoading,
    isError,
  } = useQuery<Highlight[] | null>({
    queryKey: ["matchHighlights", fixtureId],
    queryFn: () => fetchHighlights(fixtureId),
    staleTime: 1000 * 60 * 5,
    enabled: !!fixtureId,
  });

  // Use the exact same slider settings as the reference component
  const sliderSettings = {
    dots: false,
    infinite: highlights ? highlights.length > 1 : false, // Be infinite only if there's more than one slide
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 8000,
    pauseOnHover: true,
  };

  if (isError || (!isLoading && (!highlights || highlights.length === 0))) {
    return null;
  }

  if (isLoading) {
    return <SliderSkeleton />;
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Film size={22} className="text-brand-purple" />
          {t("match_highlights_title")}
        </h2>
      </div>
      <div className="relative w-full">
        {" "}
        {/* Wrapper for arrow positioning */}
        <Slider {...sliderSettings}>
          {highlights?.map((highlight) => (
            <HighlightSlide key={highlight.id} highlight={highlight} />
          ))}
        </Slider>
      </div>
    </div>
  );
}
