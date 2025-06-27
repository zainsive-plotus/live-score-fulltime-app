import Image from 'next/image';

const PlayerList = ({ title, players }: { title: string, players: any[] }) => (
  <div>
    <h4 className="font-bold text-lg mb-2 text-brand-muted">{title}</h4>
    <ul className="space-y-3">
      {players.map((p: any) => (
        <li key={p.player.id} className="flex items-center gap-3">
          <span className="text-brand-muted font-mono w-6 text-center">{p.player.number}</span>
          <span>{p.player.name}</span>
        </li>
      ))}
    </ul>
  </div>
);

// This component displays the starting XI and substitutes for both teams
export default function LineupsTab({ lineups }: { lineups: any[] }) {
  if (!lineups || lineups.length < 2) {
    return <p className="text-brand-muted text-center py-8">Lineups are not yet available.</p>;
  }

  const homeLineup = lineups[0];
  const awayLineup = lineups[1];

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Home Team */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Image src={homeLineup.team.logo} alt={homeLineup.team.name} width={32} height={32}/>
          <h3 className="font-bold text-xl">{homeLineup.team.name}</h3>
        </div>
        <p className="mb-4 text-brand-muted">Formation: {homeLineup.formation}</p>
        <PlayerList title="Starting XI" players={homeLineup.startXI} />
        <PlayerList title="Substitutes" players={homeLineup.substitutes} />
      </div>
      {/* Away Team */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Image src={awayLineup.team.logo} alt={awayLineup.team.name} width={32} height={32}/>
          <h3 className="font-bold text-xl">{awayLineup.team.name}</h3>
        </div>
        <p className="mb-4 text-brand-muted">Formation: {awayLineup.formation}</p>
        <PlayerList title="Starting XI" players={awayLineup.startXI} />
        <PlayerList title="Substitutes" players={awayLineup.substitutes} />
      </div>
    </div>
  );
}