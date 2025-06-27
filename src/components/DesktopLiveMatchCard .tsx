"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from '@/components/StyledLink'; 
import { History, ChevronDown, BarChart2 } from 'lucide-react';
import VotingPanel from './VotingPanel';
import { useTranslation } from '@/hooks/useTranslation';

interface MatchCardProps {
  match: any;
}

export default function LiveMatchCard({ match }: MatchCardProps) {
  const { fixture, teams, goals, league, events } = match;
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const isLive = ['1H', 'HT', '2H', 'ET', 'P'].includes(fixture.status.short);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.status.short);
  const isUpcoming = !isLive && !isFinished;

  const momentumData = useMemo(() => {
    if (!isLive || !events || events.length === 0) return { teamId: null, type: null };
    const lastMajorEvent = [...events].reverse().find(e => e.type === 'Goal' || (e.type === 'Card' && e.detail === 'Red Card'));
    if (!lastMajorEvent) return { teamId: null, type: null };
    let momentumTeamId = lastMajorEvent.team.id;
    if (lastMajorEvent.type === 'Card') {
      momentumTeamId = momentumTeamId === teams.home.id ? teams.away.id : teams.home.id;
    }
    return { teamId: momentumTeamId, type: lastMajorEvent.type };
  }, [events, isLive, teams.home.id, teams.away.id]);

  return (
    <div className="bg-[#252837] rounded-xl overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4">
        <div className="flex justify-between items-center text-sm text-brand-muted mb-4">
            <span className="font-semibold truncate pr-4">{league.name} - {league.round}</span>
            {isLive && <div className="flex items-center gap-2 flex-shrink-0"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-live"></span></span><span className="text-brand-live font-semibold">{fixture.status.elapsed}' {t('live')}</span></div>}
            {isFinished && <div className="flex items-center gap-1.5 bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full"><History size={12} /><span className="font-semibold text-xs">{t('finished')}</span></div>}
            {isUpcoming && <div className="font-bold text-brand-light">{format(new Date(fixture.date), "HH:mm")}</div>}
        </div>

        <div className="flex items-center justify-between">
            {/* Home Team - Using flex-1 for robust sizing */}
            <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                <div className="relative">
                    <Image src={teams.home.logo} alt={teams.home.name} width={64} height={64} className="object-contain h-16"/>
                    {momentumData.teamId === teams.home.id && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className={`absolute inline-flex h-full w-full rounded-full ${momentumData.type === 'Goal' ? 'bg-green-400' : 'bg-red-400'} opacity-75 animate-ping`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${momentumData.type === 'Goal' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                    )}
                </div>
                <h3 className="font-bold text-lg mt-2 text-brand-light w-full truncate">{teams.home.name}</h3>
            </div>
            
            {/* Score - Added padding for spacing */}
            <div className="text-4xl font-black text-white px-2 sm:px-4">
                {goals.home ?? 0} - {goals.away ?? 0}
            </div>
            
            {/* Away Team - Using flex-1 for robust sizing */}
            <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                <div className="relative">
                    <Image src={teams.away.logo} alt={teams.away.name} width={64} height={64} className="object-contain h-16"/>
                    {momentumData.teamId === teams.away.id && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                           <span className={`absolute inline-flex h-full w-full rounded-full ${momentumData.type === 'Goal' ? 'bg-green-400' : 'bg-red-400'} opacity-75 animate-ping`}></span>
                           <span className={`relative inline-flex rounded-full h-3 w-3 ${momentumData.type === 'Goal' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                    )}
                </div>
                <h3 className="font-bold text-lg mt-2 text-brand-light w-full truncate">{teams.away.name}</h3>
            </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 border-t border-gray-700/50 pt-3">
            <Link href={`/football/match/${fixture.id}`} className="flex items-center gap-2 text-xs text-brand-muted hover:text-white transition-colors">
                <BarChart2 size={14} />
                <span>{t('match_details')}</span>
            </Link>
            {!isFinished && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 font-bold transition-all duration-300 rounded-lg px-3 py-1 bg-green-500/10"
                    aria-label={isExpanded ? t('hide_panel') : t('vote_and_see_poll')}
                >
                    <span>{isExpanded ? t('hide_panel') : t('vote_and_see_poll')}</span>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            )}
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            {isExpanded && <div className="p-4 space-y-4">
                <VotingPanel fixtureId={fixture.id} teams={teams} />
              </div>}
          </div>
      </div>
    </div>
  );
}
