"use client";

import React from "react";
import RecentNewsWidget from "./RecentNewsWidget";
import CasinoPartnerWidget from "./CasinoPartnerWidget";
import AdSlotWidget from "./AdSlotWidget";

// --- START OF MODIFICATION ---
// The component now accepts an optional 'children' prop to render the Table of Contents
export default function NewsSidebar({
  children,
}: {
  children?: React.ReactNode;
}) {
  // --- END OF MODIFICATION ---

  return (
    <aside className="space-y-8 lg:sticky lg:top-8">
      {/* The Table of Contents will be rendered here if provided */}
      {children}

      <AdSlotWidget location="news_sidebar" />
      <RecentNewsWidget />
      {/* <CasinoPartnerWidget /> */}
      {/* Added a second ad slot for better monetization opportunities */}
      <AdSlotWidget location="news_sidebar_bottom" />
    </aside>
  );
}
