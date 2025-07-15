import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueDetailView from "@/components/league-detail-view";
import axios from "axios";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

async function getLeagueData(leagueId: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues?id=${leagueId}`,
      {
        headers: {
          "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
        },
      }
    );
    if (!data.response || data.response.length === 0) return null;
    const leagueData = data.response[0];

    if (leagueData.league.type === "League") {
      const standingsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/standings`,
        {
          params: { league: leagueId, season: new Date().getFullYear() },
          headers: {
            "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
          },
        }
      );
      leagueData.league.standings =
        standingsResponse.data.response[0]?.league?.standings || [];
    } else {
      leagueData.league.standings = [];
    }
    return leagueData;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    return { title: t("not_found_title") };
  }

  const leagueData = await getLeagueData(leagueId);

  if (!leagueData) {
    return { title: t("not_found_title") };
  }

  const { league, country } = leagueData;
  const pagePath = `/football/league/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);

  return {
    title: t("league_page_title", {
      leagueName: league.name,
      countryName: country.name,
    }),
    description: t("league_page_description", {
      leagueName: league.name,
      countryName: country.name,
    }),
    alternates: hreflangAlternates,
  };
}

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}) {
  const { slug } = await params;
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    notFound();
  }

  const leagueData = await getLeagueData(leagueId);

  if (!leagueData) {
    notFound();
  }

  // LeagueDetailView and its children use useTranslation hook,
  // which will get the locale from the context provider.
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />
        <main className="min-w-0">
          <LeagueDetailView leagueData={leagueData} />
        </main>
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
