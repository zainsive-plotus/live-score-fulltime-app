// ===== src/components/player/PlayerSquadSidebarWidget.tsx =====
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import StyledLink from "../StyledLink";
import { generatePlayerSlug } from "@/lib/generate-player-slug";
import { proxyImageUrl } from "@/lib/image-proxy";
import axios from "axios";

const fetchTeamSquad = async (teamId: number) => {
  // This client-side function will call our server-side data fetching function
  // For this to work, we need an API route. Let's create one.
  const { data } = await axios.get(`/api/team-squad?teamId=${teamId}`);
  return data;
};

const PlayerRow = ({ player }: { player: any }) => (
  <StyledLink
    href={generatePlayerSlug(player.name, player.id)}
    className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-dark transition-colors group"
  >
    <Image
      src={proxyImageUrl(
        `https://media.api-sports.io/football/players/${player.id}.png`
      )}
      alt={player.name}
      width={32}
      height={32}
      className="rounded-full bg-gray-700"
    />
    <div className="min-w-0">
      <p className="font-semibold text-sm text-white truncate group-hover:text-brand-purple">
        {player.name}
      </p>
      <p className="text-xs text-brand-muted">{player.position}</p>
    </div>
    <span className="ml-auto text-lg font-black text-brand-muted">
      #{player.number}
    </span>
  </StyledLink>
);

const WidgetSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 animate-pulse">
    <div className="h-6 w-3/4 bg-gray-700 rounded mb-4"></div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-gray-600"></div>
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-full bg-gray-600 rounded"></div>
            <div className="h-3 w-1/2 bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function PlayerSquadSidebarWidget({ team }: { team: any }) {
  const { t } = useTranslation();

  const {
    data: squad,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teamSquad", team.id],
    queryFn: () => fetchTeamSquad(team.id),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!team?.id,
  });

  if (isLoading) return <WidgetSkeleton />;
  if (isError || !squad || squad.length === 0) return null;

  return (
    <div className="bg-brand-secondary rounded-lg">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="font-bold text-lg text-white flex items-center gap-3">
          <Image
            src={proxyImageUrl(team.logo)}
            alt={team.name}
            width={24}
            height={24}
          />
          <span className="truncate">
            {team.name} {t("squad")}
          </span>
        </h3>
      </div>
      <div className="p-2 space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
        {squad.map((player: any) => (
          <PlayerRow key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
