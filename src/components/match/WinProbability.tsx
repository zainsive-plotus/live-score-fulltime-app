"use client";
import { memo } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const WinProbability = memo(function WinProbability({ home, draw, away }: { home: number, draw: number, away: number }) {
    const homeColor = '#8B5CF6'; // purple-500
    const awayColor = '#3B82F6'; // blue-500
    
    return (
        <div className="w-32 h-32 relative">
            <div className="absolute inset-0 transform scale-75">
                <CircularProgressbar
                    value={away}
                    styles={buildStyles({
                        pathColor: awayColor,
                        trailColor: 'transparent',
                        pathTransitionDuration: 0.5,
                    })}
                />
            </div>
            <CircularProgressbar
                value={home + draw}
                counterClockwise
                styles={buildStyles({
                    pathColor: homeColor,
                    trailColor: 'transparent',
                    pathTransitionDuration: 0.5,
                })}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-brand-muted">DRAW</p>
                <p className="font-black text-2xl text-white">{draw}%</p>
            </div>
        </div>
    );
});
export default WinProbability;