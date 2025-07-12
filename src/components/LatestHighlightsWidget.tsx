// ===== src/components/LatestHighlightsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Slider from "react-slick";
import HighlightSlide from "./HighlightSlide";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Interface for a single highlight
interface Highlight {
  id: string;
  embedUrl: string;
  title: string;
}

const fetchLatestHighlights = async (): Promise<Highlight[] | null> => {
  try {
    const { data } = await axios.get("/api/highlights/latest");
    return data?.highlights || null;
  } catch (error) {
    console.error("[LatestHighlightsWidget] Failed to fetch highlights", error);
    return null;
  }
};

const SliderSkeleton = () => (
  <div className="aspect-video w-full bg-brand-dark rounded-lg animate-pulse"></div>
);

// Custom Arrow Components
const NextArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/70 transition-colors"
    aria-label="Next slide"
  >
    <ChevronRight size={20} />
  </button>
);

const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-16 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/70 transition-colors"
    aria-label="Previous slide"
  >
    <ChevronLeft size={20} />
  </button>
);

export default function LatestHighlightsWidget() {
  const {
    data: highlights,
    isLoading,
    isError,
  } = useQuery<Highlight[] | null>({
    queryKey: ["latestHighlightsWidget"],
    queryFn: fetchLatestHighlights,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const sliderSettings = {
    dots: false, // MODIFIED: Removed dots
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true, // MODIFIED: Enabled arrows
    nextArrow: <NextArrow />, // ADDED: Custom next arrow
    prevArrow: <PrevArrow />, // ADDED: Custom previous arrow
    autoplay: true,
    autoplaySpeed: 8000,
    pauseOnHover: true,
  };

  if (isError || (!isLoading && (!highlights || highlights.length === 0))) {
    return null;
  }

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      {/* MODIFIED: Wrapped the slider in a relative container for positioning the arrows */}
      <div className="relative w-full">
        {isLoading ? (
          <SliderSkeleton />
        ) : (
          <Slider {...sliderSettings}>
            {highlights?.map((highlight) => (
              <HighlightSlide key={highlight.id} highlight={highlight} />
            ))}
          </Slider>
        )}
      </div>
    </section>
  );
}
