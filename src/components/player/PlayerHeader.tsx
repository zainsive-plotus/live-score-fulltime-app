// ===== src/components/player/PlayerHeader.tsx =====
"use client";

import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Calendar, Flag, Shield } from "lucide-react";
import { useTeamColor } from "@/lib/color-extractor";

export default function PlayerHeader({
  player,
  statistics,
  availableSeasons,
  selectedSeason,
  onSeasonChange,
}: {
  player: any;
  statistics: any;
  availableSeasons: number[];
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
}) {
  const team = statistics?.team;
  const teamLogoUrl = team?.logo;

  const { games } = statistics || {};

  const dominantColor = useTeamColor(teamLogoUrl);

  const InfoPill = ({ icon: Icon, value }: any) => (
    <div className="flex items-center gap-2 bg-black/20 text-text-secondary text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
      <Icon size={16} />
      <span>{value}</span>
    </div>
  );

  return (
    <div
      className="relative p-6 rounded-lg overflow-hidden border border-gray-700/50"
      style={{
        background: `radial-gradient(circle at 30% 50%, ${dominantColor}30, transparent 40%), radial-gradient(circle at 80% 60%, #8b5cf615, transparent 50%), var(--brand-secondary)`,
      }}
    >
      {teamLogoUrl && (
        <Image
          src={proxyImageUrl(teamLogoUrl)}
          alt={`${team.name} watermark`}
          width={250}
          height={250}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[3%] pointer-events-none"
        />
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <Image
            src={proxyImageUrl(player.photo)}
            alt={player.name}
            width={128}
            height={128}
            className="rounded-full border-4 border-brand-secondary/50 shadow-2xl shadow-black/50"
            priority
          />
          {teamLogoUrl && (
            <Image
              src={proxyImageUrl(teamLogoUrl)}
              alt={team.name}
              width={48}
              height={48}
              className="rounded-full absolute -bottom-2 -right-2 border-4 border-brand-secondary bg-white p-1"
            />
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1
            className="text-4xl md:text-5xl font-extrabold text-white"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            {player.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
            <InfoPill icon={Flag} value={player.nationality} />
            <InfoPill icon={Calendar} value={`${player.age} years old`} />
            <InfoPill icon={Shield} value={games?.position} />

            {availableSeasons && availableSeasons.length > 1 && (
              <select
                value={selectedSeason}
                onChange={(e) => onSeasonChange(Number(e.target.value))}
                aria-label="Select season"
                className="bg-black/20 text-text-secondary text-sm font-semibold pl-3 pr-8 py-1.5 rounded-full backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-purple appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239e9e9e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.25em",
                }}
              >
                {availableSeasons.map((season) => (
                  <option key={season} value={season}>
                    Season {season}/{season + 1}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
