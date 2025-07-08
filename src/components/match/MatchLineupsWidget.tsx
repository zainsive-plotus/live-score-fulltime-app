// src/components/match/MatchLineupsWidget.tsx
"use client";

import { memo } from "react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Shirt, Users } from "lucide-react";

// --- HELPER FUNCTION: Maps a formation and player list to X/Y coordinates ---
const mapFormationToPositions = (formation: string, startXI: any[]) => {
  const formationParts = formation.split("-").map(Number);
  if (formationParts.some(isNaN)) {
    console.warn(`Invalid formation string: ${formation}`);
    return startXI.map((p) => ({ ...p, pos: { x: 50, y: 50 } }));
  }

  const players = [...startXI]; // Create a mutable copy
  const positionedPlayers = [];

  // 1. Goalkeeper
  const goalkeeper = players.find((p) => p.player.pos === "G");
  if (goalkeeper) {
    positionedPlayers.push({ ...goalkeeper, pos: { x: 50, y: 92 } });
  }

  const outfieldPlayers = players.filter((p) => p.player.pos !== "G").reverse(); // Reverse to pull from defense first

  // 2. Outfield Players
  const totalRows = formationParts.length;
  let playerIndex = 0;

  formationParts.forEach((playersInRow, rowIndex) => {
    const y = 80 - (rowIndex / (totalRows - 1)) * 65; // Y position from ~80% (defense) to ~15% (attack)
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

// --- NEW SUB-COMPONENT: The Football Pitch Visualization ---
const FootballPitch = ({
  team,
  positionedPlayers,
  colorClass,
}: {
  team: any;
  positionedPlayers: any[];
  colorClass: string;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-primary)]">
        <div className="flex items-center gap-3">
          <Image
            src={proxyImageUrl(team.logo)}
            alt={team.name}
            width={32}
            height={32}
          />
          <h3 className="font-bold text-lg text-white">{team.name}</h3>
        </div>
        <span className="text-sm font-semibold text-text-muted">
          {team.formation}
        </span>
      </div>

      <div className="relative aspect-[7/10] w-full rounded-lg overflow-hidden bg-gradient-to-b from-[#067139] to-[#045229]">
        {/* Pitch Markings */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] aspect-square rounded-full border-2 border-white/20"></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/20"></div>
          <div className="absolute top-0 left-[20%] w-[60%] h-[18%] rounded-b-lg border-2 border-l-2 border-r-2 border-t-0 border-white/20"></div>
          <div className="absolute bottom-0 left-[20%] w-[60%] h-[18%] rounded-t-lg border-2 border-l-2 border-r-2 border-b-0 border-white/20"></div>
        </div>

        {/* Players */}
        <div className="absolute inset-0 z-10">
          {positionedPlayers.map(({ player, pos }) => (
            <div
              key={player.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
              style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
              title={player.name}
            >
              <div
                className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full font-bold text-white text-sm shadow-md border-2 border-black/30 transition-transform group-hover:scale-110 ${colorClass}`}
              >
                {player.number}
              </div>
              <span className="text-xs font-semibold text-white bg-black/40 px-1.5 py-0.5 rounded-full whitespace-nowrap hidden group-hover:block">
                {player.name.split(" ").slice(-1)[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Player List for Substitutes (Simplified) ---
const SubsList = ({ players }: { players: any[] }) => {
  if (!players || players.length === 0) return null;
  return (
    <div className="bg-[var(--color-primary)]/50 p-4 rounded-lg mt-4">
      <h4 className="flex items-center gap-2 font-bold text-base mb-3 text-text-muted">
        <Users size={18} /> Substitutes
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        {players.map((p: any) => (
          <div key={p.player.id} className="flex items-center gap-2 truncate">
            <span className="text-text-muted font-mono w-6 text-center">
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

// --- The Main, Redesigned Lineups Widget ---
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
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Match Formation
      </h2>

      {/* Main container for both pitches and sub lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
