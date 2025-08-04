// ===== src/components/skeletons/WidgetSkeletons.tsx =====

"use client";

export const AdSlotWidgetSkeleton = () => (
  <div className="w-full h-[250px] bg-brand-secondary rounded-lg animate-pulse"></div>
);

export const RecentNewsWidgetSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg shadow-lg animate-pulse">
    <div className="p-4 border-b border-gray-700/50">
      <div className="h-6 w-3/4 bg-gray-700 rounded"></div>
    </div>
    <div className="p-2 space-y-1">
      <SidebarNewsItemSkeleton />
      <SidebarNewsItemSkeleton />
      <SidebarNewsItemSkeleton />
      <SidebarNewsItemSkeleton />
    </div>
  </div>
);

const SidebarNewsItemSkeleton = () => (
  <div className="flex flex-col gap-1.5 p-3">
    <div className="h-4 w-full rounded bg-gray-700"></div>
    <div className="h-3 w-1/3 rounded bg-gray-700"></div>
  </div>
);
