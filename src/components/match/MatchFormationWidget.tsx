// ===== src/components/match/MatchFormationWidget.tsx =====

"use client";

import { memo } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Shirt, Users, UserSquare } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const fetchLineups = async (fixtureId: string) => {
  const { data } = await axios.get(`/api/lineups?fixtureId=${fixtureId}`);
  return data;
};

// Helper to calculate player positions based on formation string
const mapFormationToPositions = (formation: string, startXI: any[]) => {
  if (
    !formation ||
    !startXI ||
    !Array.isArray(startXI) ||
    startXI.length < 11
  ) {
    return (startXI || []).map((p, i) => ({
      ...p.player,
      pos: { x: (i % 4) * 25 + 12.5, y: Math.floor(i / 4) * 25 + 15 },
    }));
  }

  const formationParts = formation
    .split("-")
    .map(Number)
    .filter((n) => !isNaN(n));
  if (formationParts.reduce((a, b) => a + b, 0) !== 10) {
    return startXI.map((p, i) => ({
      ...p.player,
      pos: { x: (i % 4) * 25 + 12.5, y: Math.floor(i / 4) * 25 + 15 },
    }));
  }

  const players = [...startXI];
  const positionedPlayers = [];

  const goalkeeper = players.find((p) => p.player.pos === "G");
  if (goalkeeper) {
    positionedPlayers.push({ ...goalkeeper.player, pos: { x: 50, y: 95 } });
  }

  const outfieldPlayers = players.filter((p) => p.player.pos !== "G").reverse();
  const totalRows = formationParts.length;
  let playerIndex = 0;

  formationParts.forEach((playersInRow, rowIndex) => {
    const y = 85 - ((rowIndex + 1) / (totalRows + 1)) * 75;
    playersToPosition(playersInRow).forEach((player, i) => {
      if (!player) return;
      const x = (100 / (playersInRow + 1)) * (i + 1);
      positionedPlayers.push({ ...player.player, pos: { x, y } });
    });
  });

  function playersToPosition(num: number) {
    const arr = [];
    for (let i = 0; i < num; i++) {
      arr.push(outfieldPlayers.shift());
    }
    return arr;
  }

  return positionedPlayers;
};

const Player = memo(
  ({ player, colorClass }: { player: any; colorClass: string }) => (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group cursor-pointer"
      style={{ top: `${player.pos.y}%`, left: `${player.pos.x}%` }}
      title={player.name}
    >
      <div className="relative">
        <Image
          src={proxyImageUrl(player.photo)}
          alt={player.name}
          width={40}
          height={40}
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
    </div>
  )
);
Player.displayName = "Player";

const FootballPitch = ({
  team,
  players,
  colorClass,
  t,
}: {
  team: any;
  players: any[];
  colorClass: string;
  t: (key: string) => string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-3 px-2">
      <h3 className="font-bold text-xl text-white">{team.team.name}</h3>
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-muted bg-brand-dark/50 px-3 py-1.5 rounded-lg">
        <Shirt size={16} />
        {team.formation}
      </div>
    </div>
    <div
      className="relative aspect-[7/10] w-full rounded-lg overflow-hidden border-2 border-white/10"
      style={{
        background: "radial-gradient(circle, #057F3A 0%, #034F24 100%)",
      }}
    >
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square rounded-full border-2 border-white/20"></div>
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/20"></div>
        <div className="absolute top-0 left-[20%] w-[60%] h-[15%] rounded-b-xl border-b-2 border-l-2 border-r-2 border-white/20"></div>
        <div className="absolute bottom-0 left-[20%] w-[60%] h-[15%] rounded-t-xl border-t-2 border-l-2 border-r-2 border-white/20"></div>
      </div>
      <div className="absolute inset-0 z-10">
        {players.map((player) => (
          <Player key={player.id} player={player} colorClass={colorClass} />
        ))}
      </div>
    </div>
    <div className="bg-brand-dark/30 p-3 rounded-b-lg space-y-3">
      <div>
        <h4 className="flex items-center gap-2 font-bold text-sm mb-2 text-brand-muted">
          <Users size={16} /> {t("substitutes")}
        </h4>
        <p className="text-xs text-brand-light leading-relaxed">
          {team.substitutes.map((p: any) => p.player.name).join(", ")}
        </p>
      </div>
      <div>
        <h4 className="flex items-center gap-2 font-bold text-sm mb-2 text-brand-muted">
          <UserSquare size={16} /> {t("coach")}
        </h4>
        <p className="text-sm font-semibold text-brand-light">
          {team.coach.name}
        </p>
      </div>
    </div>
  </div>
);

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

  // --- THIS IS THE FIX ---
  // If the essential data isn't present, return null to hide the widget.
  if (
    isError ||
    !lineups ||
    lineups.length < 2 ||
    !lineups[0].formation || // Check specifically for formation string
    !lineups[1].formation ||
    !lineups[0].startXI ||
    !lineups[1].startXI
  ) {
    return null;
  }
  // --- END OF FIX ---

  const homeLineup = lineups[0];
  const awayLineup = lineups[1];
  const homePositionedPlayers = mapFormationToPositions(
    homeLineup.formation,
    homeLineup.startXI
  );
  const awayPositionedPlayers = mapFormationToPositions(
    awayLineup.formation,
    awayLineup.startXI
  );

  return (
    <div className="bg-brand-secondary rounded-lg p-4 md:p-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {t("formations")}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FootballPitch
          team={homeLineup}
          players={homePositionedPlayers}
          colorClass="bg-[var(--brand-accent)]"
          t={t}
        />
        <FootballPitch
          team={awayLineup}
          players={awayPositionedPlayers}
          colorClass="bg-blue-600"
          t={t}
        />
      </div>
    </div>
  );
});
