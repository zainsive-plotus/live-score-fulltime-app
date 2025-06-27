import { RefreshCw, Square, Target } from 'lucide-react';
import { memo } from 'react';
import Image from 'next/image';

function EventsTabContent({ events, teams }: { events: any[], teams: any }) {
    if (!events || events.length === 0) {
        return <p className="text-brand-muted text-center py-8">No key events were recorded for this match.</p>;
    }

    const getEventIcon = (event: any) => {
        switch (event.type) {
            case 'Goal': return <Target className="text-green-400" size={20} />;
            case 'Card': return <Square className={event.detail === 'Yellow Card' ? 'text-yellow-400' : 'text-red-500'} size={20} />;
            case 'subst': return <RefreshCw className="text-blue-400" size={18} />;
            default: return null;
        }
    };

    return (
        <div className="relative p-4 md:p-6">
            {/* The vertical timeline bar */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-700/50"></div>

            <div className="space-y-4">
                {events.map((event, index) => {
                    const isHomeTeam = event.team.id === teams.home.id;
                    
                    // Conditionally render the entire event card on the left or right
                    return (
                        <div key={index} className="flex justify-between items-center w-full">
                            
                            {/* --- HOME TEAM EVENT (Left Side) --- */}
                            {isHomeTeam ? (
                                <>
                                    <div className="w-[calc(50%-2.5rem)] md:w-[calc(50%-3rem)] relative">
                                        <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-800 rotate-45 z-0"></div>
                                        <div className="bg-gray-800/80 rounded-lg p-3 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <Image src={event.team.logo} alt={event.team.name} width={32} height={32} />
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm md:text-base">{event.player.name}</p>
                                                    {event.type === 'subst' && <p className="text-xs text-brand-muted">Replaced by {event.assist.name}</p>}
                                                    {event.type === 'Goal' && event.assist.name && <p className="text-xs text-brand-muted">Assist by {event.assist.name}</p>}
                                                    {event.type === 'Card' && <p className="text-xs text-brand-muted">{event.detail}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center Icon */}
                                    <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center z-10 ring-4 ring-brand-secondary">
                                        <div className="flex flex-col items-center">
                                            {getEventIcon(event)}
                                            <span className="text-xs font-bold">{event.time.elapsed}'</span>
                                        </div>
                                    </div>

                                    {/* Empty spacer for the right side */}
                                    <div className="w-[calc(50%-2.5rem)] md:w-[calc(50%-3rem)]"></div>
                                </>
                            ) : (
                                <>
                                    {/* Empty spacer for the left side */}
                                    <div className="w-[calc(50%-2.5rem)] md:w-[calc(50%-3rem)]"></div>
                                    
                                    {/* Center Icon */}
                                     <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center z-10 ring-4 ring-brand-secondary">
                                        <div className="flex flex-col items-center">
                                            {getEventIcon(event)}
                                            <span className="text-xs font-bold">{event.time.elapsed}'</span>
                                        </div>
                                    </div>

                                    {/* --- AWAY TEAM EVENT (Right Side) --- */}
                                    <div className="w-[calc(50%-2.5rem)] md:w-[calc(50%-3rem)] relative">
                                        <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-800 rotate-45 z-0"></div>
                                        <div className="bg-gray-800/80 rounded-lg p-3 relative z-10">
                                            <div className="flex items-center gap-3 text-right flex-row-reverse">
                                                <Image src={event.team.logo} alt={event.team.name} width={32} height={32} />
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm md:text-base">{event.player.name}</p>
                                                    {event.type === 'subst' && <p className="text-xs text-brand-muted">Replaced by {event.assist.name}</p>}
                                                    {event.type === 'Goal' && event.assist.name && <p className="text-xs text-brand-muted">Assist by {event.assist.name}</p>}
                                                    {event.type === 'Card' && <p className="text-xs text-brand-muted">{event.detail}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MatchEventsWidget({ events, teams }) {
    return (
        <div className="bg-brand-secondary rounded-xl">
            <h3 className="text-lg font-bold p-4 border-b border-gray-700/50">Match Timeline</h3>
            <EventsTabContent events={events} teams={teams} />
        </div>
    );
}

export default MatchEventsWidget;