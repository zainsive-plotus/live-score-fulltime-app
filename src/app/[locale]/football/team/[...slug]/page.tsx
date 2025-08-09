// ===== src/app/[locale]/football/team/[...slug]/page.tsx =====

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchTeamDetails } from "@/lib/data/team";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

import TeamHeader from "@/components/team/TeamHeader";
import TeamSquadWidget from "@/components/team/TeamSquadWidget";
import TeamFixturesWidget from "@/components/team/TeamFixturesWidget";
import TeamInfoWidget from "@/components/team/TeamInfoWidget";
import TeamTrophiesWidget from "@/components/team/TeamTrophiesWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";

const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const teamId = getTeamIdFromSlug(slug[0]);

  if (!teamId) return { title: t("not_found_title") };

  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) return { title: t("not_found_title") };

  const { team } = teamData.teamInfo;
  const pagePath = `/football/team/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(
    "/football/team",
    slug.join("/"),
    locale
  );

  const pageTitle = t("team_page_meta_title", { teamName: team.name });
  const pageDescription = t("team_page_meta_description", {
    teamName: team.name,
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
  const { locale, slug } = params;
  const t = await getI18n(locale);

  const teamId = getTeamIdFromSlug(slug[0]);
  if (!teamId) notFound();

  // --- THIS IS THE FIX ---
  // The data fetching logic is now clearly inside the async function component.
  // This removes any ambiguity for the build process.
  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) notFound();
  // --- END OF FIX ---

  const { teamInfo, squad, fixtures } = teamData;
  const { team, venue } = teamInfo;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0 space-y-8">
          <TeamHeader
            team={team}
            countryFlag={teamInfo.team.country && fixtures?.[0]?.league?.flag}
            foundedText={t("founded_in", { year: team.founded })}
          />
          <TeamFixturesWidget fixtures={fixtures} />
          <TeamSquadWidget squad={squad} />
        </main>

        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <TeamInfoWidget venue={venue} />
          <TeamTrophiesWidget teamId={team.id} />
          <RecentNewsWidget />
          <AdSlotWidget location="match_sidebar" />
        </aside>
      </div>
    </div>
  );
}
