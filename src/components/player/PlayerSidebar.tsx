// ===== src/components/player/PlayerSidebar.tsx =====
"use client";

import dynamic from "next/dynamic";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";

// Import the new widget directly since it's a client component
import PlayerSquadSidebarWidget from "./PlayerSquadSidebarWidget";

const AdSlotWidget = dynamic(() => import("@/components/AdSlotWidget"), {
  loading: () => <AdSlotWidgetSkeleton />,
  ssr: false,
});
const RecentNewsWidget = dynamic(
  () => import("@/components/RecentNewsWidget"),
  {
    loading: () => <RecentNewsWidgetSkeleton />,
  }
);

// The sidebar now needs the current team's data
export default function PlayerSidebar({ team }: { team: any }) {
  return (
    <>
      <PlayerSquadSidebarWidget team={team} />
      <RecentNewsWidget />
      <AdSlotWidget location="player_sidebar" />
    </>
  );
}
