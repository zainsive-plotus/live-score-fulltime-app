"use client";

import { memo } from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

// This is a static promotional component.
const BettingPromotionWidget = memo(function BettingPromotionWidget() {
    
    const handleBetClick = () => {
        console.log("Redirecting to casino partner from sidebar widget...");
        // In a real app: window.open('https://chinchincasino.com/signup', '_blank');
    };

    return (
        <div className="bg-gradient-to-br from-green-500/20 to-brand-purple/20 p-4 rounded-xl border border-green-400/30 text-center space-y-3">
            
            {/* You can add a logo of your betting partner here */}
            {/* <Image src="/path/to/partner-logo.svg" alt="Partner Logo" width={100} height={40} className="mx-auto" /> */}
            
            <h3 className="text-lg font-bold text-white">
                Exclusive Welcome Offer!
            </h3>
            <p className="text-sm text-brand-light">
                Get a <span className="font-bold text-green-400">100% bonus</span> on your first deposit to bet on this match.
            </p>

            {/* The animated button */}
            <div className="relative pt-2">
                <span className="absolute top-2 left-0 inline-flex h-full w-full rounded-lg bg-green-400 opacity-75 animate-ping"></span>
                <button
                    onClick={handleBetClick}
                    className="relative w-full bg-[#16A34A] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                    <ShieldCheck size={18} />
                    <span>Claim Your Bonus</span>
                </button>
            </div>

            <p className="text-xs text-brand-muted/80">
                18+ | T&Cs apply. Gamble responsibly.
            </p>
        </div>
    );
});

export default BettingPromotionWidget;