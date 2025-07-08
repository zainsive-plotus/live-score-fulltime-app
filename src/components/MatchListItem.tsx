// src/components/MatchListItem.tsx
// NO CHANGES ARE NEEDED IN THIS FILE

import DesktopMatchListItem, {
  MatchListItemSkeleton as DesktopSkeleton,
} from "./DesktopMatchListItem";
import MobileMatchListItem, {
  MobileMatchListItemSkeleton as MobileSkeleton,
} from "./MobileMatchListItem";

interface MatchListItemProps {
  match: any;
}

export default function MatchListItem({ match }: MatchListItemProps) {
  const status = match.fixture.status.short;
  const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(status);

  return (
    <>
      <div className="hidden lg:block">
        <DesktopMatchListItem match={match} isLive={isLive} />
      </div>
      <div className="block lg:hidden">
        <MobileMatchListItem match={match} />
      </div>
    </>
  );
}

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
