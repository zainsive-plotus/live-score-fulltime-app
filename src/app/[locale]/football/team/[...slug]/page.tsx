// ===== src/app/[locale]/football/team/[...slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { getTeamStaticData } from "@/lib/data/team-static"; // <-- IMPORT THE NEW LOADER

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
// We now use a more focused TeamDetailView component
import TeamHeader from "@/components/team/TeamHeader";
import TeamInfoWidget from "@/components/team/TeamInfoWidget";
import TeamTrophiesWidget from "@/components/team/TeamTrophiesWidget";
import TeamFormWidgetSidebar from "@/components/team/TeamFormWidgetSidebar";
import TeamSeoWidget from "@/components/team/TeamSeoWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
// Import the dynamic widgets
import LeagueFixturesWidget from "@/components/league-detail-view/LeagueFixturesWidget";
import TeamSquadWidget from "@/components/team/TeamSquadWidget";
// We need the data-fetching function for the dynamic part
import { getTeamFixtures, getTeamStandings } from "@/lib/data/team";
import TeamFixturesWidget from "@/components/team/TeamFixturesWidget";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// This function is now much faster
export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const teamId = getTeamIdFromSlug(slug[0]);

  const hreflangAlternates = await generateHreflangTags(
    "/football/team",
    slug.join("/"),
    locale
  );

  if (!teamId) {
    return { title: t("not_found_title"), alternates: hreflangAlternates };
  }

  // Fetch from the fast local JSON file
  const allTeamData = await getTeamStaticData();

  const teamInfo = allTeamData[teamId];

  if (!teamInfo) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  const { team } = teamInfo;
  const pageTitle = t("team_page_meta_title", {
    teamName: team.name,
    country: team.country,
  });
  const pageDescription = t("team_page_meta_description", {
    teamName: team.name,
    country: team.country,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

export default async function TeamPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const teamId = getTeamIdFromSlug(slug[0]);

  if (!teamId) {
    notFound();
  }

  // --- Core change: Fetch basic info from the static file ---
  const allTeamData = await getTeamStaticData();
  const teamInfo = allTeamData[teamId];

  if (!teamInfo) {
    notFound();
  }

  // We can still fetch some dynamic data on the server if needed, like fixtures
  const fixtures = await getTeamFixtures(teamId);

  const { team, venue } = teamInfo;

  const seoWidgetTitle = t("about_team_title", { teamName: team.name });
  const seoWidgetText = t("team_page_seo_text", {
    teamName: team.name,
    country: team.country,
  });

  return (
    <>
      {/* JSON-LD Script can be added here if needed */}
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />

          <main className="min-w-0 space-y-8">
            {/* Statically rendered header with basic info */}
            <TeamHeader
              team={team}
              countryFlag={fixtures?.[0]?.league?.flag || ""}
              foundedText={t("founded_in", { year: team.founded })}
            />

            {/* Fixtures can be server-rendered as they are relatively static */}
            <TeamFixturesWidget fixtures={fixtures} />

            {/* Squad is more dynamic, so we let it load on the client */}
            <TeamSquadWidget teamId={teamId} />

            {/* Additional widgets can also be client-side */}
          </main>

          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
            {/* These are perfect for client-side loading */}
            <TeamInfoWidget venue={venue} />
            <TeamFormWidgetSidebar teamId={team.id} fixtures={fixtures} />
            <TeamTrophiesWidget teamId={teamId} />
            <AdSlotWidget location="homepage_right_sidebar" />
            <TeamSeoWidget title={seoWidgetTitle} seoText={seoWidgetText} />
          </aside>
        </div>
      </div>
    </>
  );
}
