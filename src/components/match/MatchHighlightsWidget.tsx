// ===== src/components/match/MatchHighlightsWidget.tsx =====
"use client";

import Slider from "react-slick";
import { Film, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import HighlightSlide from "../HighlightSlide";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Highlight {
  id: string;
  embedUrl: string;
  title: string;
}

// The component now receives highlights as a prop
interface MatchHighlightsWidgetProps {
  highlights: Highlight[] | null;
}

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

export default function MatchHighlightsWidget({
  highlights,
}: MatchHighlightsWidgetProps) {
  const { t } = useTranslation();

  // If there are no highlights, don't render anything.
  if (!highlights || highlights.length === 0) {
    return null;
  }

  const sliderSettings = {
    dots: false,
    infinite: highlights.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Film size={22} className="text-brand-purple" />
          {t("match_highlights_title")}
        </h2>
      </div>
      <div className="relative w-full">
        <Slider {...sliderSettings}>
          {highlights.map((highlight) => (
            <HighlightSlide key={highlight.id} highlight={highlight} />
          ))}
        </Slider>
      </div>
    </div>
  );
}
