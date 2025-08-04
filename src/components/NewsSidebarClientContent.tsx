// ===== src/components/NewsSidebarClientContent.tsx =====

"use client";

import dynamic from "next/dynamic";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "./skeletons/WidgetSkeletons";

// Dynamically import the heavy components here
const AdSlotWidget = dynamic(() => import("./AdSlotWidget"), {
  loading: () => <AdSlotWidgetSkeleton />,
  ssr: false,
});

const RecentNewsWidget = dynamic(() => import("./RecentNewsWidget"), {
  loading: () => <RecentNewsWidgetSkeleton />,
});

const CasinoPartnerWidget = dynamic(() => import("./CasinoPartnerWidget"), {
  loading: () => <RecentNewsWidgetSkeleton />,
});

export default function NewsSidebarClientContent() {
  return (
    <>
      <AdSlotWidget location="news_sidebar" />
      <RecentNewsWidget />
      <CasinoPartnerWidget />
      <AdSlotWidget location="news_sidebar_bottom" />
    </>
  );
}
