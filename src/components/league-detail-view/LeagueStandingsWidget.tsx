// ===== src/components/league-detail-view/LeagueStandingsWidget.tsx =====
"use client";

import { useState } from "react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "@/components/StyledLink";
import { Info, ListOrdered } from "lucide-react";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { useTranslation } from "@/hooks/useTranslation";
import Slider from "react-slick";

interface TeamStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  goalsDiff: number;
  description: string | null;
  group: string;
}

interface LeagueStandingsWidgetProps {
  standings: TeamStanding[][]; // The nested array of groups
  league: { seasons: number[]; id: number }; // Pass seasons for the dropdown
}

const getRankIndicatorClass = (description: string | null): string => {
  if (!description) return "bg-gray-700/50 border-gray-600/50";
  const desc = description.toLowerCase();
  if (desc.includes("champions league"))
    return "bg-blue-500/20 border-blue-500";
  if (desc.includes("promotion")) return "bg-green-500/20 border-green-500";
  if (desc.includes("europa league"))
    return "bg-orange-500/20 border-orange-500";
  if (desc.includes("relegation")) return "bg-red-600/20 border-red-600";
  return "bg-gray-700/50 border-gray-600/50";
};

export default function LeagueStandingsWidget({
  standings,
  league,
}: LeagueStandingsWidgetProps) {
  const { t } = useTranslation();
  const [season, setSeason] = useState(league.seasons[0]); // Default to the latest season

  // Note: Add logic here to refetch standings when season changes if this becomes a fully dynamic component

  if (!standings || standings.length === 0) {
    return (
      <div className="bg-brand-secondary rounded-lg p-6 text-center">
        <Info size={32} className="mx-auto text-brand-muted mb-3" />
        <p className="font-semibold text-white">
          {t("standings_not_available")}
        </p>
      </div>
    );
  }

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    appendDots: (dots: any) => (
      <div>
        <ul className="m-0 pt-3"> {dots} </ul>
      </div>
    ),
  };

  return (
    <div className="bg-brand-secondary rounded-lg">
      <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ListOrdered size={22} /> {t("standings")}
        </h2>
        {/* Season selector can be added back here if needed */}
      </div>

      {standings.length > 1 ? (
        <Slider {...sliderSettings} className="p-4">
          {standings.map((group, index) => (
            <div key={index}>
              <h3 className="text-center font-bold text-brand-light mb-3">
                {group[0].group}
              </h3>
              <StandingsTable group={group} t={t} />
            </div>
          ))}
        </Slider>
      ) : (
        <StandingsTable group={standings[0]} t={t} />
      )}
    </div>
  );
}

const StandingsTable = ({
  group,
  t,
}: {
  group: TeamStanding[];
  t: (key: string) => string;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-separate border-spacing-0">
      <thead className="text-left text-text-muted sticky top-0 bg-brand-secondary z-10">
        <tr className="text-xs uppercase">
          <th className="p-2 w-8 text-center font-semibold">
            {t("table_header_rank_short")}
          </th>
          <th className="p-2 font-semibold">{t("table_header_team")}</th>
          <th className="p-2 text-center font-semibold">
            {t("table_header_played_short")}
          </th>
          <th className="p-2 text-center font-semibold">{t("wins_short")}</th>
          <th className="p-2 text-center font-semibold">{t("draws_short")}</th>
          <th className="p-2 text-center font-semibold">{t("losses_short")}</th>
          <th className="p-2 text-center font-semibold">
            {t("table_header_goaldiff_short")}
          </th>
          <th className="p-2 text-center font-bold">
            {t("table_header_points_short")}
          </th>
        </tr>
      </thead>
      <tbody className="text-brand-light">
        {group.map((item) => (
          <tr
            key={item.team.id}
            className="hover:bg-[var(--color-primary)]/50 transition-colors"
          >
            <td
              className={`p-2 border-t border-gray-700/50 text-center border-l-4 ${getRankIndicatorClass(
                item.description
              )}`}
            >
              <span className="font-bold">{item.rank}</span>
            </td>
            <td className="p-2 border-t border-gray-700/50">
              <StyledLink
                href={generateTeamSlug(item.team.name, item.team.id)}
                className="flex items-center gap-2 group"
              >
                <Image
                  src={proxyImageUrl(item.team?.logo)}
                  alt={item.team.name}
                  width={20}
                  height={20}
                />
                <span className="font-semibold group-hover:text-[var(--brand-accent)] transition-colors whitespace-nowrap truncate">
                  {item.team.name}
                </span>
              </StyledLink>
            </td>
            <td className="p-2 text-center text-text-muted border-t border-gray-700/50">
              {item.all.played}
            </td>
            <td className="p-2 text-center text-green-400 border-t border-gray-700/50">
              {item.all.win}
            </td>
            <td className="p-2 text-center text-yellow-400 border-t border-gray-700/50">
              {item.all.draw}
            </td>
            <td className="p-2 text-center text-red-400 border-t border-gray-700/50">
              {item.all.lose}
            </td>
            <td className="p-2 text-center text-text-muted border-t border-gray-700/50">
              {item.goalsDiff}
            </td>
            <td className="p-2 text-center font-bold text-white border-t border-gray-700/50">
              {item.points}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
