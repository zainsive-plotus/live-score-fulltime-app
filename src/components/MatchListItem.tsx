// src/components/MatchListItem.tsx
import DesktopMatchListItem, {
  MatchListItemSkeleton as DesktopSkeleton,
} from "./DesktopMatchListItem";
import MobileMatchListItem, {
  MobileMatchListItemSkeleton as MobileSkeleton,
} from "./MobileMatchListItem";

// Define a type for the odds object for better type safety
type Odds =
  | {
      home: string;
      draw: string;
      away: string;
    }
  | undefined;

// Define the props for the component, including the new optional liveOdds
interface MatchListItemProps {
  match: any;
  liveOdds?: Odds;
  customOdds?: Odds;
}

// This component acts as a router, displaying the correct list item
// based on the screen size and passing all necessary props down.
export default function MatchListItem({
  match,
  liveOdds,
  customOdds,
}: MatchListItemProps) {
  // --- THIS IS THE FIX ---
  // 1. Centralize the "isLive" logic here.
  const status = match.fixture.status.short;
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status);

  return (
    <>
      {/* Desktop version (now receives customOdds) */}
      <div className="hidden lg:block">
        <DesktopMatchListItem
          match={match}
          liveOdds={liveOdds}
          isLive={isLive}
          customOdds={customOdds}
        />
      </div>

      {/* Mobile version (now receives customOdds) */}
      <div className="block lg:hidden">
        <MobileMatchListItem
          match={match}
          liveOdds={liveOdds}
          isLive={isLive}
          customOdds={customOdds}
        />
      </div>
    </>
  );
}

// This component routes to the correct skeleton. No changes are needed here.
export const MatchListItemSkeleton = () => {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopSkeleton />
      </div>
      <div className="block lg:hidden">
        <MobileSkeleton />
      </div>
    </>
  );
};
