// src/app/[locale]/football/team/[...slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/dbConnect"; // We will use this for the build
import Team from "@/models/Team"; // We will use this for the build
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { fetchTeamDetails } from "@/lib/data/team";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamHeader from "@/components/team/TeamHeader";
import TeamSquadWidget from "@/components/team/TeamSquadWidget";
import TeamFixturesWidget from "@/components/team/TeamFixturesWidget";
import TeamInfoWidget from "@/components/team/TeamInfoWidget";
import TeamTrophiesWidget from "@/components/team/TeamTrophiesWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import TeamSeoWidget from "@/components/team/TeamSeoWidget";
import Script from "next/script";
import { WithContext, SportsTeam, BreadcrumbList } from "schema-dts";

// // Revalidate team pages once a day (86400 seconds) to keep data fresh.
// export const revalidate = 86400;

// const BASE_URL =
//   process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// // This function now pre-builds only a subset of important team pages.
// // Other team pages will be generated on-demand when first visited.
// export async function generateStaticParams() {
//   try {
//     console.log(
//       "[generateStaticParams/Team] Connecting to DB to fetch popular teams..."
//     );
//     await dbConnect();

//     // Define the most popular countries to pre-build teams from.
//     const popularCountries = [
//       "England",
//       "Spain",
//       "Italy",
//       "Germany",
//       "France",
//       "Turkey",
//     ];

//     // Fetch only teams from these popular countries directly from your database.
//     const popularTeams = await Team.find({ country: { $in: popularCountries } })
//       .select("name teamId")
//       .lean(); // .lean() makes it super fast

//     console.log(
//       `[generateStaticParams/Team] Found ${popularTeams.length} popular teams to pre-build.`
//     );

//     const params = popularTeams.map((team) => {
//       const fullPath = generateTeamSlug(team.name, team.teamId);
//       const slugPart = fullPath.split("/").pop() || "";

//       return {
//         slug: [slugPart],
//       };
//     });

//     return params;
//   } catch (error) {
//     console.error(
//       "[generateStaticParams/Team] Failed to fetch popular teams for pre-building:",
//       error
//     );
//     return [];
//   }
// }

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

  const hreflangAlternates = await generateHreflangTags(
    "/football/team",
    slug.join("/"),
    locale
  );

  if (!teamId) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
    };
  }

  // This part runs for each page generation. It will still make API calls.
  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  const { team } = teamData.teamInfo;
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

  const teamData = await fetchTeamDetails(teamId);
  if (!teamData) notFound();

  const { teamInfo, squad, fixtures } = teamData;
  const { team, venue } = teamInfo;

  const seoWidgetTitle = t("team_seo_widget_title", { teamName: team.name });
  const seoWidgetText = t("team_page_seo_text", { teamName: team.name });

  const jsonLd: WithContext<SportsTeam | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: team.name,
      sport: "Soccer",
      logo: team.logo,
      url: `${BASE_URL}/${locale}/football/team/${slug[0]}`,
      location: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: venue.city,
          addressCountry: team.country,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("homepage"),
          item: `${BASE_URL}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("football_teams_title"),
          item: `${BASE_URL}/${locale}/football/teams`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: team.name,
        },
      ],
    },
  ];

  return (
    <>
      <Script
        id="team-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <TeamSeoWidget title={seoWidgetTitle} seoText={seoWidgetText} />
            <RecentNewsWidget />
            <AdSlotWidget location="match_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
