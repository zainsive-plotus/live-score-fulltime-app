import { memo } from 'react';
import Image from 'next/image';
import { CheckCircle, XCircle, ShieldQuestion, TrendingUp, TrendingDown } from 'lucide-react';

// A small, reusable component to display the W-D-L form streak.
const FormGuide = memo(function FormGuide({ formString }: { formString: string }) {
    if (!formString) return <span className="text-xs text-text-muted">N/A</span>;
    
    return (
        <div className="flex items-center gap-1.5">
            {formString.split('').slice(0, 5).map((result, index) => {
                const classes = {
                    W: 'bg-green-500 text-green-900',
                    D: 'bg-gray-500 text-gray-900',
                    L: 'bg-red-500 text-red-900',
                };
                return (
                    <span 
                        key={index} 
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${classes[result as keyof typeof classes]}`}
                    >
                        {result}
                    </span>
                );
            })}
        </div>
    );
});


// The main widget component.
const MatchAnalyticsWidget = memo(function MatchAnalyticsWidget({ analytics }: { analytics: any }) {

    // If there's no prediction data, don't render the widget.
    if (!analytics?.prediction || !analytics.homeTeamStats || !analytics.awayTeamStats) {
        return (
             <div className="bg-brand-secondary rounded-xl">
                <h3 className="text-lg font-bold p-4 border-b border-gray-700/50">Prediction & Form</h3>
                <p className="text-text-muted text-center py-8">Analytics are not available for this match.</p>
            </div>
        );
    }

    const { prediction, homeTeamStats, awayTeamStats } = analytics;
    const { percent } = prediction.predictions;
    const btts = prediction.comparison.btts === 'Yes';
    const overUnder = prediction.comparison.under_over === 'Over 2.5';

    // Parse percentages, removing '%' and converting to numbers.
    const homePercent = parseFloat(percent.home.replace('%', ''));
    const drawPercent = parseFloat(percent.draw.replace('%', ''));
    const awayPercent = parseFloat(percent.away.replace('%', ''));
    
    return (
        <div className="bg-brand-secondary rounded-xl">
            <h3 className="text-lg font-bold p-4 border-b border-gray-700/50">Prediction & Form</h3>
            <div className="p-4 space-y-5">

                {/* --- 1. Win Probability Section --- */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <div className="flex flex-col items-center gap-1 text-center">
                            <Image src={homeTeamStats.team.logo} alt={homeTeamStats.team.name} width={32} height={32} />
                            <span className="font-bold text-lg text-white">{homePercent}%</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-text-muted text-sm font-semibold">Draw</span>
                            <span className="font-bold text-lg text-white">{drawPercent}%</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                            <Image src={awayTeamStats.team.logo} alt={awayTeamStats.team.name} width={32} height={32} />
                            <span className="font-bold text-lg text-white">{awayPercent}%</span>
                        </div>
                    </div>
                    {/* The visual win-distribution bar */}
                    <div className="flex w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-secondary)' }}>
                        <div className="bg-brand-purple" style={{ width: `${homePercent}%` }}></div>
                        <div className="bg-gray-500" style={{ width: `${drawPercent}%` }}></div>
                        <div className="bg-brand-highlight" style={{ width: `${awayPercent}%` }}></div>
                    </div>
                </div>

                {/* --- 2. Key Insights Section --- */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-3 rounded-lg" style={{backgroundColor: 'var(--color-primary)'}}>
                        {btts ? <CheckCircle size={20} className="text-green-400" /> : <XCircle size={20} className="text-red-400" />}
                        <span className="font-semibold">Both Teams to Score</span>
                    </div>
                     <div className="flex items-center gap-2 p-3 rounded-lg" style={{backgroundColor: 'var(--color-primary)'}}>
                        {overUnder ? <TrendingUp size={20} className="text-green-400" /> : <TrendingDown size={20} className="text-red-400" />}
                        <span className="font-semibold">Over 2.5 Goals</span>
                    </div>
                </div>

                {/* --- 3. Team Form Guide Section --- */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-secondary">{homeTeamStats.team.name}</span>
                        <FormGuide formString={homeTeamStats.form} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-secondary">{awayTeamStats.team.name}</span>
                        <FormGuide formString={awayTeamStats.form} />
                    </div>
                </div>
                
                {/* --- 4. Final Advice Section --- */}
                {prediction.predictions.advice && (
                    <div className="flex items-center gap-2 p-3 text-center rounded-lg border-2 border-dashed border-gray-700">
                        <ShieldQuestion size={20} className="text-brand-purple flex-shrink-0" />
                        <p className="text-sm font-semibold text-text-secondary">{prediction.predictions.advice}</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default MatchAnalyticsWidget;