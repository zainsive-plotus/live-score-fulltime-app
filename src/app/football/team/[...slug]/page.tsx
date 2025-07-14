// src/app/football/team/[...slug]/page.tsx
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamDetailView from "@/components/TeamDetailView";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchTeamDetails } from "@/lib/data/team";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import TeamInfoWidget from "@/components/team/TeamInfoWidget";
import TeamTrophiesWidget from "@/components/team/TeamTrophiesWidget";

// Helper and metadata functions (unchanged)
const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};
export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Promise<Metadata> {
  const slug = await params.slug.join("/");
  const teamId = getTeamIdFromSlug(slug);
  if (!teamId) return { title: "Team Not Found" };
  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) return { title: "Team Not Found" };
  const { team } = teamData.teamInfo;
  const pageTitle = `Fanskor | ${team.name} Oyuncular, Fikstürler ve Sıralamalar`;
  const pageDescription = `View the full squad, recent fixtures, and current standings for ${team.name}.`;
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: `/football/team/${slug}` },
  };
}

// --- THE MAIN PAGE COMPONENT (WITH ENHANCED 3-COLUMN LAYOUT) ---
export default async function TeamPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug.join("/");
  const teamId = getTeamIdFromSlug(slug);
  if (!teamId) {
    notFound();
  }

  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) {
    notFound();
  }

  const { teamInfo, squad, fixtures } = teamData;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* --- THIS IS THE FIX: The new 3-column grid layout --- */}
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0">
          {/* TeamDetailView now only handles the main content column */}
          <TeamDetailView teamData={teamData} />
        </main>

        {/* --- NEW: Right Sidebar Column --- */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0 sticky top-6">
          <TeamInfoWidget venue={teamInfo.venue} />
          <TeamTrophiesWidget teamId={teamInfo.team.id} />
          <RecentNewsWidget />
          {/* <CasinoPartnerWidget /> */}
          <AdSlotWidget location="match_sidebar" />{" "}
          {/* Reusing the same ad slot */}
        </aside>
      </div>
    </div>
  );
}
