import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamDetailView from "@/components/TeamDetailView";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchTeamDetails } from "@/lib/data/team";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { getI18n } from "@/lib/i18n/server"; // <-- Import server helper

const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const t = await getI18n();
  const slug = (await params).slug.join("/");
  const teamId = getTeamIdFromSlug(slug);

  if (!teamId) return { title: t("not_found_title") };

  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) return { title: t("not_found_title") };

  const { team } = teamData.teamInfo;
  const pageTitle = t("team_page_title", { teamName: team.name });
  const pageDescription = t("team_page_description", { teamName: team.name });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: `/football/team/${slug}` },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug.join("/");
  const teamId = getTeamIdFromSlug(slug);
  if (!teamId) {
    notFound();
  }

  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) {
    notFound();
  }

  // TeamDetailView is already an async server component, so we can await it.
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />
        <main className="min-w-0">
          <TeamDetailView teamData={teamData} />
        </main>
        {/* We will refactor TeamInfoWidget and TeamTrophiesWidget to be client components
            so they can use the useTranslation hook. For now, they will render without it inside TeamDetailView.
            The alternative is to pass many translated props down, which we did for TeamHeader.
        */}
      </div>
    </div>
  );
}
