import { ReactNode } from 'react';

interface LeagueStatCardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
}

export default function LeagueStatCard({ icon, label, value }: LeagueStatCardProps) {
    return (
        <div className="bg-brand-secondary p-4 rounded-lg flex items-center gap-4">
            <div className="flex-shrink-0 bg-brand-purple/20 text-brand-purple p-3 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-sm text-brand-muted">{label}</p>
                <p className="font-bold text-white text-lg">{value}</p>
            </div>
        </div>
    );
}