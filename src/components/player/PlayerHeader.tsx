// ===== src/components/player/PlayerHeader.tsx =====
"use client";

import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { MapPin, Calendar, Users, Flag } from "lucide-react";

export default function PlayerHeader({
  player,
  statistics,
}: {
  player: any;
  statistics: any;
}) {
  const InfoItem = ({ icon: Icon, value }: any) => (
    <div className="flex items-center gap-1.5 text-sm text-text-muted">
      <Icon size={14} />
      <span>{value}</span>
    </div>
  );

  return (
    <div className="bg-brand-secondary p-6 rounded-lg flex flex-col md:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <Image
          src={proxyImageUrl(player.photo)}
          alt={player.name}
          width={128}
          height={128}
          className="rounded-full border-4 border-brand-dark"
        />
        <Image
          src={proxyImageUrl(statistics.team.logo)}
          alt={statistics.team.name}
          width={48}
          height={48}
          className="rounded-full absolute -bottom-2 -right-2 border-2 border-brand-secondary bg-white p-1"
        />
      </div>
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          {player.name}
        </h1>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-3">
          <InfoItem icon={Flag} value={player.nationality} />
          <InfoItem icon={Calendar} value={`${player.age} years old`} />
          <InfoItem icon={Users} value={statistics.games.position} />
        </div>
      </div>
    </div>
  );
}
