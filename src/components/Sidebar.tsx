// ===== src/components/Sidebar.tsx =====

import { Suspense } from "react";
import PopularTeamsList from "./PopularTeamsList";
import AdSlotWidget from "./AdSlotWidget";
import { getI18n } from "@/lib/i18n/server";
import SidebarLeagueList, {
  SidebarLeagueListSkeleton,
} from "./SidebarLeagueList";

export default async function Sidebar() {
  const t = await getI18n();

  return (
    <aside className="hidden lg:block">
      <div className="flex flex-col gap-4 h-auto">
        <AdSlotWidget location="homepage_left_sidebar" />

        {/* This section now correctly suspends while the data-fetching component loads */}
        <section
          className="flex flex-col gap-2 p-3 rounded-xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-bold uppercase tracking-wider text-text-muted px-2">
            {t("popular_leagues")}
          </p>
          <Suspense fallback={<SidebarLeagueListSkeleton />}>
            <SidebarLeagueList />
          </Suspense>
        </section>

        <section
          className="flex flex-col gap-2 p-3 rounded-xl sticky top-8"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-bold uppercase tracking-wider text-text-muted px-2">
            {t("popular_teams")}
          </p>
          <PopularTeamsList />
        </section>
      </div>
    </aside>
  );
}
