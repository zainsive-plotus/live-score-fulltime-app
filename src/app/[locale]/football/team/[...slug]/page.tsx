import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamDetailView from "@/components/TeamDetailView";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchTeamDetails } from "@/lib/data/team";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getI18n(locale);
  const teamId = getTeamIdFromSlug(slug[0]);

  if (!teamId) {
    return { title: t("not_found_title") };
  }

  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) {
    return { title: t("not_found_title") };
  }

  const { team } = teamData.teamInfo;
  const pagePath = `/football/team/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);

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
  params: Promise<{ slug: string[]; locale: string }>;
}) {
  const { locale, slug } = await params;

  const teamId = getTeamIdFromSlug(slug[0]);
  if (!teamId) {
    notFound();
  }

  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) {
    notFound();
  }

  // The TeamDetailView component and its children will get the locale
  // from the context provided by the root LocaleLayout.
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />
        <main className="min-w-0">
          <TeamDetailView teamData={teamData} />
        </main>
      </div>
    </div>
  );
}
