import { memo } from 'react';

// This is the core display logic, kept as a memoized sub-component for cleanliness.
const StatsContent = memo(function StatsContent({ statistics, teams }: { statistics: any[], teams: any }) {
    // Find the statistics for each team. Default to an empty array if not found.
    const homeStats = statistics.find(s => s.team.id === teams.home.id)?.statistics || [];
    const awayStats = statistics.find(s => s.team.id === teams.away.id)?.statistics || [];

    // Create a unique set of all available stat types from both teams.
    // This ensures all stats are displayed even if one team has a stat the other doesn't.
    const allStatTypes = Array.from(new Set([...homeStats.map((s: any) => s.type), ...awayStats.map((s: any) => s.type)]));

    return (
        // The main container for the stats grid. It's a single column on mobile and two columns on desktop.
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {allStatTypes.map(type => {
                // Find the specific stat value for each team, defaulting to '0'.
                const homeStatValue = homeStats.find((s: any) => s.type === type)?.value ?? '0';
                const awayStatValue = awayStats.find((s: any) => s.type === type)?.value ?? '0';
                
                // Convert values to numbers, removing '%' if present, for calculating the progress bar width.
                const homeValueNum = parseFloat(String(homeStatValue).replace('%', ''));
                const awayValueNum = parseFloat(String(awayStatValue).replace('%', ''));
                const total = homeValueNum + awayValueNum;
                
                // Calculate the percentage width for the home team's bar.
                const homePercent = total > 0 ? (homeValueNum / total) * 100 : 50;

                return (
                    <div key={type}>
                        {/* Header for each stat (e.g., "5  Ball Possession  95") */}
                        <div className="flex justify-between items-center mb-1.5 text-sm font-semibold">
                            <span className="text-white w-1/4 text-left">{homeStatValue}</span>
                            <span className="text-text-muted w-1/2 text-center">{type}</span>
                            <span className="text-white w-1/4 text-right">{awayStatValue}</span>
                        </div>
                        {/* The visual progress bar */}
                        <div className="flex w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}>
                            <div className="bg-brand-purple rounded-l-full" style={{ width: `${homePercent}%` }}></div>
                            <div className="bg-brand-highlight rounded-r-full" style={{ width: `${100 - homePercent}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});


// This is the main exported widget component.
const MatchStatsWidget = memo(function MatchStatsWidget({ statistics, teams }: { statistics: any[], teams: any }) {
    // If there are no stats for one of the teams, don't render the widget at all.
    if (!statistics || statistics.length < 2) {
        return null;
    }
    
    return (
        <div className="bg-brand-secondary rounded-xl">
            <h3 className="text-lg font-bold p-4 border-b border-gray-700/50">
                Team Statistics
            </h3>
            <StatsContent statistics={statistics} teams={teams} />
        </div>
    );
});

export default MatchStatsWidget;