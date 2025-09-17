// ===== src/components/match/MatchFormationWidget.tsx =====

import { memo } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Users, UserSquare } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
// --- IMPORT THE SLUG GENERATOR AND LINK COMPONENT ---
import { generatePlayerSlug } from "@/lib/generate-player-slug";
import StyledLink from "../StyledLink";

// ... (fetchLineups and mapFormationToPositions functions remain the same) ...
const fetchLineups = async (fixtureId: string) => {
  const { data } = await axios.get(`/api/lineups?fixtureId=${fixtureId}`);
  return data;
};

const mapFormationToPositions = (
  formation: string,
  startXI: any[],
  isHomeTeam: boolean
) => {
  if (
    !formation ||
    !startXI ||
    !Array.isArray(startXI) ||
    startXI.length < 11
  ) {
    return [];
  }
  const formationParts = formation
    .split("-")
    .map(Number)
    .filter((n) => !isNaN(n));
  if (formationParts.reduce((a, b) => a + b, 0) !== 10) return [];

  const players = [...startXI];
  const positionedPlayers = [];

  const goalkeeper = players.find((p) => p.player.pos === "G");
  if (goalkeeper) {
    positionedPlayers.push({
      ...goalkeeper.player,
      pos: { x: 50, y: isHomeTeam ? 95 : 5 },
    });
  }

  const outfieldPlayers = players.filter((p) => p.player.pos !== "G");

  if (!isHomeTeam) outfieldPlayers.reverse();

  const totalRows = formationParts.length;
  let playerIndex = 0;

  formationParts.forEach((playersInRow, rowIndex) => {
    const y = isHomeTeam
      ? 90 - ((rowIndex + 1) / (totalRows + 1)) * 40
      : 10 + ((rowIndex + 1) / (totalRows + 1)) * 40;

    for (let i = 0; i < playersInRow; i++) {
      if (playerIndex < outfieldPlayers.length) {
        const x = (100 / (playersInRow + 1)) * (i + 1);
        positionedPlayers.push({
          ...outfieldPlayers[playerIndex].player,
          pos: { x, y },
        });
        playerIndex++;
      }
    }
  });

  return positionedPlayers;
};

const Player = memo(
  ({ player, colorClass }: { player: any; colorClass: string }) => {
    const playerPhotoUrl = `https://media.api-sports.io/football/players/${player.id}.png`;
    // --- CREATE THE PLAYER'S UNIQUE URL ---
    const playerHref = generatePlayerSlug(player.name, player.id);

    return (
      // --- WRAP THE PLAYER REPRESENTATION IN A STYLEDLINK ---
      <StyledLink
        href={playerHref}
        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group cursor-pointer"
        style={{ top: `${player.pos.y}%`, left: `${player.pos.x}%` }}
        title={player.name}
      >
        <div className="relative">
          <Image
            src={proxyImageUrl(playerPhotoUrl)}
            alt={player.name}
            width={40}
            height={40}
            unoptimized={true}
            className="rounded-full bg-black/20 w-10 h-10 object-cover"
          />
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full font-bold text-white text-[10px] shadow-md border-2 border-brand-dark ${colorClass}`}
          >
            {player.number}
          </div>
        </div>
        <span className="text-xs font-semibold text-white bg-black/60 px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg">
          {player.name.split(" ").slice(-1)[0]}
        </span>
      </StyledLink>
    );
  }
);
Player.displayName = "Player";

// ... (The rest of MatchFormationWidget.tsx remains the same) ...
const FormationSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 md:p-6 animate-pulse">
    <div className="h-8 w-1/3 mx-auto bg-gray-700 rounded mb-6"></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="aspect-[7/10] w-full bg-gray-700/50 rounded-lg"></div>
      <div className="aspect-[7/10] w-full bg-gray-700/50 rounded-lg"></div>
    </div>
  </div>
);

export default memo(function MatchFormationWidget({
  fixtureId,
}: {
  fixtureId: string;
}) {
  const { t } = useTranslation();

  const {
    data: lineups,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["lineups", fixtureId],
    queryFn: () => fetchLineups(fixtureId),
    staleTime: 1000 * 60 * 5,
    enabled: !!fixtureId,
  });

  if (isLoading) {
    return <FormationSkeleton />;
  }

  if (
    isError ||
    !lineups ||
    lineups.length < 2 ||
    !lineups[0].formation ||
    !lineups[1].formation ||
    !lineups[0].startXI ||
    !lineups[1].startXI
  ) {
    return null;
  }

  const homeLineup = lineups[0];
  const awayLineup = lineups[1];
  const homePositionedPlayers = mapFormationToPositions(
    homeLineup.formation,
    homeLineup.startXI,
    true
  );
  const awayPositionedPlayers = mapFormationToPositions(
    awayLineup.formation,
    awayLineup.startXI,
    false
  );

  return (
    <div className="bg-brand-secondary rounded-lg p-4 md:p-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {t("formations")}
      </h2>

      <div className="flex justify-between items-center mb-4 px-4">
        <div className="flex items-center gap-3">
          <Image
            src={proxyImageUrl(homeLineup.team.logo)}
            alt={homeLineup.team.name}
            width={40}
            height={40}
            unoptimized={true}
          />
          <div className="text-left">
            <h3 className="font-bold text-lg text-white">
              {homeLineup.team.name}
            </h3>
            <p className="text-sm font-semibold text-brand-muted">
              {homeLineup.formation}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h3 className="font-bold text-lg text-white">
              {awayLineup.team.name}
            </h3>
            <p className="text-sm font-semibold text-brand-muted">
              {awayLineup.formation}
            </p>
          </div>
          <Image
            src={proxyImageUrl(awayLineup.team.logo)}
            alt={awayLineup.team.name}
            width={40}
            height={40}
          />
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto">
        <div
          className="relative aspect-[7/10] w-full rounded-lg overflow-hidden border-2 border-white/10"
          style={{
            background: "radial-gradient(circle, #057F3A 0%, #034F24 100%)",
          }}
        >
          <div className="absolute inset-0 z-0 opacity-50">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square rounded-full border-2 border-white/20"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20"></div>
            <div className="absolute top-0 left-[20%] w-[60%] h-[15%] rounded-b-xl border-b-2 border-l-2 border-r-2 border-white/20"></div>
            <div className="absolute bottom-0 left-[20%] w-[60%] h-[15%] rounded-t-xl border-t-2 border-l-2 border-r-2 border-white/20"></div>
          </div>
          <div className="absolute inset-0 z-10">
            {homePositionedPlayers.map((player) => (
              <Player
                key={`home-${player.id}`}
                player={player}
                colorClass="bg-[var(--brand-accent)]"
              />
            ))}
            {awayPositionedPlayers.map((player) => (
              <Player
                key={`away-${player.id}`}
                player={player}
                colorClass="bg-blue-600"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-brand-dark/30 p-3 rounded-lg space-y-2">
          <h4 className="flex items-center gap-2 font-bold text-sm text-brand-muted">
            <Users size={16} /> {t("substitutes")} ({homeLineup.team.name})
          </h4>
          <p className="text-xs text-brand-light leading-relaxed">
            {homeLineup.substitutes.map((p: any) => p.player.name).join(", ")}
          </p>
        </div>
        <div className="bg-brand-dark/30 p-3 rounded-lg space-y-2">
          <h4 className="flex items-center gap-2 font-bold text-sm text-brand-muted">
            <Users size={16} /> {t("substitutes")} ({awayLineup.team.name})
          </h4>
          <p className="text-xs text-brand-light leading-relaxed">
            {awayLineup.substitutes.map((p: any) => p.player.name).join(", ")}
          </p>
        </div>
        <div className="bg-brand-dark/30 p-3 rounded-lg">
          <h4 className="flex items-center gap-2 font-bold text-sm text-brand-muted">
            <UserSquare size={16} /> {t("coach")}
          </h4>
          <p className="text-sm font-semibold text-brand-light mt-1">
            {homeLineup.coach.name}
          </p>
        </div>
        <div className="bg-brand-dark/30 p-3 rounded-lg">
          <h4 className="flex items-center gap-2 font-bold text-sm text-brand-muted">
            <UserSquare size={16} /> {t("coach")}
          </h4>
          <p className="text-sm font-semibold text-brand-light mt-1">
            {awayLineup.coach.name}
          </p>
        </div>
      </div>
    </div>
  );
});
