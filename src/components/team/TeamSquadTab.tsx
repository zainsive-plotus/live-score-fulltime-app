// src/components/team/TeamSquadTab.tsx
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";

const PlayerCard = ({ player }: { player: any }) => (
  <div className="bg-brand-secondary rounded-lg p-3 flex items-center gap-3">
    <Image
      src={proxyImageUrl(player.photo)}
      alt={player.name}
      width={48}
      height={48}
      className="rounded-full"
    />
    <div className="flex-1">
      <p className="font-bold text-white">{player.name}</p>
      <p className="text-sm text-brand-muted">{player.position}</p>
    </div>
    <div className="text-2xl font-black text-brand-muted w-12 text-center">
      {player.number || "-"}
    </div>
  </div>
);

export default function TeamSquadTab({ squad }: { squad: any[] }) {
  const goalkeepers = squad.filter((p) => p.position === "Goalkeeper");
  const defenders = squad.filter((p) => p.position === "Defender");
  const midfielders = squad.filter((p) => p.position === "Midfielder");
  const attackers = squad.filter((p) => p.position === "Attacker");

  const renderPositionGroup = (title: string, players: any[]) => {
    if (players.length === 0) return null;
    return (
      <div>
        <h4 className="text-lg font-bold text-brand-light mb-3 mt-4 border-b border-gray-700 pb-2">
          {title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderPositionGroup("Goalkeepers", goalkeepers)}
      {renderPositionGroup("Defenders", defenders)}
      {renderPositionGroup("Midfielders", midfielders)}
      {renderPositionGroup("Attackers", attackers)}
    </div>
  );
}
