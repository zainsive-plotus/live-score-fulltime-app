"use client";

import { memo } from 'react';
import Image from 'next/image';
import Accordion from '@/components/Accordion'; // Reusing our custom Accordion component

// A clean, reusable sub-component to display a list of players (Starting XI or Subs).
const PlayerList = memo(function PlayerList({ title, players }: { title: string, players: any[] }) {
    if (!players || players.length === 0) return null;

    return (
        <div>
            <h4 className="font-bold text-base mb-3 mt-4 text-text-muted border-b border-gray-700/50 pb-2">
                {title}
            </h4>
            <ul className="space-y-3 pt-2">
                {players.map((p: any) => (
                    <li key={p.player.id} className="flex items-center gap-3 text-sm">
                        <span className="text-text-muted font-mono w-8 text-center flex-shrink-0">
                            {p.player.number}
                        </span>
                        <span className="font-medium text-text-secondary">
                            {p.player.name}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
});


// The main widget component that orchestrates the display.
const MatchLineupsWidget = memo(function MatchLineupsWidget({ lineups }: { lineups: any[] }) {
    // If there are no lineups (or not enough data), don't render the widget.
    if (!lineups || lineups.length < 2) {
        return null; 
    }

    const homeLineup = lineups[0];
    const awayLineup = lineups[1];

    // This is the title for the Home Team's accordion, including its logo and name.
    const homeAccordionTitle = (
        <div className="flex items-center gap-3">
            <Image src={homeLineup.team.logo} alt={homeLineup.team.name} width={28} height={28}/>
            <h3 className="font-bold text-lg text-white">
                {homeLineup.team.name} Lineup
            </h3>
        </div>
    );

    // This is the title for the Away Team's accordion.
    const awayAccordionTitle = (
        <div className="flex items-center gap-3">
            <Image src={awayLineup.team.logo} alt={awayLineup.team.name} width={28} height={28}/>
            <h3 className="font-bold text-lg text-white">
                {awayLineup.team.name} Lineup
            </h3>
        </div>
    );

    return (
        // The main container. overflow-hidden is important for the accordion's rounded corners.
        <div className="bg-brand-secondary rounded-xl overflow-hidden">
            
            {/* Accordion for the Home Team */}
            <Accordion 
                title={homeAccordionTitle}
                statusNode={<span className="text-sm font-mono text-text-muted">{homeLineup.formation}</span>}
                defaultOpen={true} // The home team's lineup is open by default.
            >
                <PlayerList title="Starting XI" players={homeLineup.startXI} />
                <PlayerList title="Substitutes" players={homeLineup.substitutes} />
            </Accordion>
            
            {/* Accordion for the Away Team */}
            <Accordion 
                title={awayAccordionTitle}
                statusNode={<span className="text-sm font-mono text-text-muted">{awayLineup.formation}</span>}
                // The away team's lineup is closed by default to save space.
            >
                <PlayerList title="Starting XI" players={awayLineup.startXI} />
                <PlayerList title="Substitutes" players={awayLineup.substitutes} />
            </Accordion>
        </div>
    );
});

export default MatchLineupsWidget;