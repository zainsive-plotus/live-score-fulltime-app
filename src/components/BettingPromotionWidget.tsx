"use client";

import { memo } from 'react';
import { ShieldCheck } from 'lucide-react';

// Using React.memo is a good practice for static components like this,
// as it prevents them from re-rendering if their props don't change.
const BettingPromotionWidget = memo(function BettingPromotionWidget() {
    
    // This handler can be updated later to redirect to a real partner link.
    const handleBetClick = () => {
        console.log("Redirecting to casino partner...");
        // Example of a real implementation:
        // window.open('https://your-partner-link.com/signup', '_blank');
    };

    return (
        <div className="bg-gradient-to-br from-green-500/20 to-brand-purple/20 p-4 rounded-xl border border-green-400/30 text-center space-y-3">
            
            <h3 className="text-lg font-bold text-white">
                Exclusive Welcome Offer!
            </h3>
            
            <p className="text-sm text-brand-light">
                Get a <span className="font-bold text-green-400">100% bonus</span> on your first deposit to bet on today's matches.
            </p>

            {/* The animated button container */}
            <div className="relative pt-2">
                {/* This span creates the pulsing glow effect behind the button */}
                <span className="absolute top-2 left-0 inline-flex h-full w-full rounded-lg bg-green-400 opacity-75 animate-ping"></span>
                
                <button
                    onClick={handleBetClick}
                    className="relative w-full bg-[#16A34A] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                    <ShieldCheck size={18} />
                    <span>Claim Your Bonus Now</span>
                </button>
            </div>

            <p className="text-xs text-brand-muted/80">
                18+ | T&Cs apply. Please gamble responsibly.
            </p>
        </div>
    );
});

export default BettingPromotionWidget;