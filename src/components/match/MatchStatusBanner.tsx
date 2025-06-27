"use client";

import { memo } from 'react';
import { format } from 'date-fns';

interface MatchStatusBannerProps {
  fixture: any;
}

// This component displays a colored banner with the match's current status.
const MatchStatusBanner = memo(function MatchStatusBanner({ fixture }: MatchStatusBannerProps) {
    const status = fixture.fixture.status;
    
    // Determine the text and background color based on the status code
    let content = <p>{status.long}</p>;
    let bgClass = 'bg-gray-600'; // Default for statuses like 'Postponed'

    switch (status.short) {
        case 'TBD':
        case 'NS':
            content = <p>Upcoming - {format(new Date(fixture.fixture.date), 'HH:mm')}</p>;
            bgClass = 'bg-blue-600';
            break;
        case '1H':
        case 'HT':
        case '2H':
        case 'ET':
        case 'P':
            content = <p className="animate-pulse">{status.elapsed}' - {status.long}</p>;
            bgClass = 'bg-red-600';
            break;
        case 'FT':
        case 'AET':
        case 'PEN':
            content = <p>Full Time</p>;
            bgClass = 'bg-gray-800';
            break;
    }

    return (
        <div className={`text-center font-bold text-white py-2 rounded-b-xl text-sm tracking-wider mb-8 ${bgClass}`}>
            {content}
        </div>
    );
});

export default MatchStatusBanner;