import { BarChart2 } from 'lucide-react';

// This component displays a side-by-side comparison of team stats
export default function StatsTab({ statistics, teams }: { statistics: any[], teams: any }) {
  if (!statistics || statistics.length < 2) {
    return <p className="text-brand-muted text-center py-8">Statistics are not available for this match.</p>;
  }

  const homeStats = statistics.find((s: any) => s.team.id === teams.home.id)?.statistics || [];
  const awayStats = statistics.find((s: any) => s.team.id === teams.away.id)?.statistics || [];
  
  // Combine stats to ensure we display all available types
  const allStatTypes = Array.from(new Set([...homeStats.map((s: any) => s.type), ...awayStats.map((s: any) => s.type)]));

  return (
    <div className="space-y-4 p-4">
      {allStatTypes.map((type) => {
        const homeStat = homeStats.find((s: any) => s.type === type)?.value ?? 0;
        const awayStat = awayStats.find((s: any) => s.type === type)?.value ?? 0;
        const total = (Number(homeStat) || 0) + (Number(awayStat) || 0);
        const homePercent = total > 0 ? ((Number(homeStat) || 0) / total) * 100 : 50;

        return (
          <div key={type}>
            <div className="flex justify-between items-center mb-1 text-sm font-semibold">
              <span>{homeStat ?? 0}</span>
              <span className="text-brand-muted">{type}</span>
              <span>{awayStat ?? 0}</span>
            </div>
            <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-700">
              <div className="bg-brand-purple" style={{ width: `${homePercent}%` }}></div>
              <div className="bg-blue-600" style={{ width: `${100 - homePercent}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}