"use client";
import { memo } from 'react';

// Displays W-D-L streak
const FormGuide = memo(function FormGuide({ form, teamId }: { form: any[], teamId: number }) {
    if (!form || form.length === 0) return null;

    return (
        <div className="flex items-center gap-1.5">
            {form.map((match: any) => {
                const goals = match.goals;
                const home = match.teams.home;
                
                let result = 'D';
                if (goals.home !== goals.away) {
                    const winnerId = goals.home > goals.away ? home.id : match.teams.away.id;
                    result = winnerId === teamId ? 'W' : 'L';
                }
                
                const classes = {
                    W: 'bg-green-500 text-green-900',
                    D: 'bg-gray-500 text-gray-900',
                    L: 'bg-red-500 text-red-900',
                };
                
                return (
                    <span key={match.fixture.id} className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${classes[result as keyof typeof classes]}`}>
                        {result}
                    </span>
                );
            })}
        </div>
    );
});
export default FormGuide;