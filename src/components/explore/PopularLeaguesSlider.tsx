"use client";

import Slider from "react-slick";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { League } from "@/types/api-football";
import StyledLink from "../StyledLink";
import Image from "next/image";

// A dedicated card for the league slider
const LeagueSliderCard = ({ league }: { league: League }) => (
  <div className="px-2">
    <StyledLink href={league.href} className="block group">
      <div className="bg-brand-secondary rounded-lg p-3 flex flex-col items-center justify-center text-center h-32 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20">
        <Image 
          src={league.logoUrl}
          alt={league.name}
          width={48}
          height={48}
          className="bg-white rounded-full p-1 mb-2"
        />
        <h4 className="font-bold text-white text-sm truncate w-full group-hover:text-brand-purple transition-colors">{league.name}</h4>
      </div>
    </StyledLink>
  </div>
);

const SkeletonCard = () => (
    <div className="px-2"><div className="bg-brand-secondary rounded-lg h-32 animate-pulse"></div></div>
);

const fetchPopularLeagues = async (): Promise<League[]> => {
    // This fetches only the curated popular leagues by not including the `fetchAll` param
    const { data } = await axios.get('/api/leagues?type=league');
    return data;
};

export default function PopularLeaguesSlider() {
    const { data: leagues, isLoading } = useQuery({
        queryKey: ['popularLeaguesExplore'],
        queryFn: fetchPopularLeagues,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

    const sliderSettings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 2,
        arrows: false,
        responsive: [
            { breakpoint: 768, settings: { slidesToShow: 3.2 } },
            { breakpoint: 640, settings: { slidesToShow: 2.2 } },
        ]
    };

    if (isLoading) {
        return <Slider {...sliderSettings} className="-mx-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /></Slider>;
    }
    
    if (!leagues) return null;

    return (
        <Slider {...sliderSettings} className="-mx-2">
            {leagues.map(league => (
                <LeagueSliderCard key={league.id} league={league} />
            ))}
        </Slider>
    );
}