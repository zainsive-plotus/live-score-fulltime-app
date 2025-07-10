// src/components/match/MatchLineupsWidget.tsx
"use client";

import { memo } from "react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Users } from "lucide-react";

// --- HELPER FUNCTION: Maps a formation to player coordinates ---
const mapFormationToPositions = (formation: string, startXI: any[]) => {
  // --- THIS IS THE FIX ---
  // If formation is null, undefined, or an empty string, immediately return a default grid layout.
  // This prevents the .split() method from ever being called on a non-string value.
  if (!formation) {
    console.warn(
      `Invalid or missing formation string received. Using fallback grid layout.`
    );
    return startXI.map((p, i) => ({
      ...p,
      pos: { x: (i % 4) * 25 + 12.5, y: Math.floor(i / 4) * 25 + 15 },
    }));
  }
  // --- END OF FIX ---

  const formationParts = formation.split("-").map(Number);
  if (formationParts.some(isNaN) || startXI.length < 11) {
    return startXI.map((p, i) => ({
      ...p,
      pos: { x: (i % 4) * 25 + 12.5, y: Math.floor(i / 4) * 25 + 15 },
    }));
  }

  const players = [...startXI];
  const positionedPlayers = [];

  const goalkeeper = players.find((p) => p.player.pos === "G");
  if (goalkeeper) {
    positionedPlayers.push({ ...goalkeeper, pos: { x: 50, y: 95 } });
  }
  const outfieldPlayers = players.filter((p) => p.player.pos !== "G").reverse();

  const totalRows = formationParts.length;
  let playerIndex = 0;

  formationParts.forEach((playersInRow, rowIndex) => {
    const y = 85 - ((rowIndex + 1) / (totalRows + 1)) * 75;
    const playersToPosition = outfieldPlayers.slice(
      playerIndex,
      playerIndex + playersInRow
    );

    playersToPosition.forEach((player, i) => {
      const x = (100 / (playersInRow + 1)) * (i + 1);
      positionedPlayers.push({ ...player, pos: { x, y } });
    });
    playerIndex += playersInRow;
  });

  return positionedPlayers;
};

// The rest of the file (FootballPitch, SubsList, MatchLineupsWidget) is unchanged.
const FootballPitch = ({
  team,
  positionedPlayers,
  colorClass,
}: {
  team: any;
  positionedPlayers: any[];
  colorClass: string;
}) => (
  <div
    className="relative aspect-[7/10] w-full rounded-lg overflow-hidden border border-white/10"
    style={{ background: "radial-gradient(circle, #057F3A 0%, #034F24 100%)" }}
  >
    <div className="absolute inset-0 z-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square rounded-full border border-white/10"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-white/10"></div>
      <div className="absolute top-0 left-[25%] w-[50%] h-[15%] rounded-b-md border-b border-l border-r border-white/10"></div>
    </div>
    <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/50 to-transparent z-20 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Image
          src={proxyImageUrl(team.team.logo)}
          alt={team.team.name}
          width={28}
          height={28}
        />
        <h3 className="font-bold text-base text-white">{team.team.name}</h3>
      </div>
      <span className="text-sm font-semibold text-text-muted bg-black/30 px-2 py-1 rounded-md">
        {team.formation || "N/A"}
      </span>
    </div>
    <div className="absolute inset-0 z-10">
      {positionedPlayers.map(({ player, pos }) => (
        <div
          key={player.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group cursor-pointer"
          style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
          title={player.name}
        >
          <div
            className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white text-xs shadow-md border-2 border-black/30 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg ${colorClass}`}
          >
            {player.number}
          </div>
          <span className="text-xs font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {player.name.split(" ").slice(-1)[0]}
          </span>
        </div>
      ))}
    </div>
  </div>
);
const SubsList = ({ players }: { players: any[] }) => {
  if (!players || players.length === 0) return null;
  return (
    <div className="bg-[var(--color-primary)]/50 p-3 rounded-lg mt-3">
      <h4 className="flex items-center gap-2 font-bold text-sm mb-2 text-text-muted">
        <Users size={16} /> Substitutes
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {players.map((p: any) => (
          <div key={p.player.id} className="flex items-center gap-2 truncate">
            <span className="text-text-muted font-mono w-5 text-center">
              {p.player.number}
            </span>
            <span className="font-medium text-text-secondary truncate">
              {p.player.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
const MatchLineupsWidget = memo(function MatchLineupsWidget({
  lineups,
}: {
  lineups: any[];
}) {
  if (!lineups || lineups.length < 2) {
    return (
      <div className="bg-brand-secondary rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Starting Lineups</h2>
        <p className="text-text-muted">
          Lineups are not yet available for this match.
        </p>
      </div>
    );
  }
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
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        Formations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FootballPitch
            team={homeLineup}
            positionedPlayers={homePositionedPlayers}
            colorClass="bg-[var(--brand-accent)]"
          />
          <SubsList players={homeLineup.substitutes} />
        </div>
        <div>
          <FootballPitch
            team={awayLineup}
            positionedPlayers={awayPositionedPlayers}
            colorClass="bg-blue-600"
          />
          <SubsList players={awayLineup.substitutes} />
        </div>
      </div>
    </div>
  );
});
export default MatchLineupsWidget;
