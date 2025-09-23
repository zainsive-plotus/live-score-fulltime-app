// ===== src/app/[locale]/football/players/[...slug]/page.tsx =====
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, Person, BreadcrumbList } from "schema-dts";
import { getI18n } from "@/lib/i18n/server";
import { getPlayerPageData, getPlayerSeasons } from "@/lib/data/player";
import Header from "@/components/Header";
import PlayerDetailView from "@/components/player/PlayerDetailView";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import PlayerSeoWidget from "@/components/player/PlayerSeoWidget";
import PlayerSidebar from "@/components/player/PlayerSidebar";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export const revalidate = 86400;

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const parsePlayerSlug = (
  slug: string[]
): { id: string; name: string } | null => {
  if (!slug || slug.length < 2) return null;
  const [id, ...nameParts] = slug;
  if (!/^\d+$/.test(id)) return null;
  return { id, name: nameParts.join("-") };
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string[]; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const slugInfo = parsePlayerSlug(slug);

  if (!slugInfo) {
    return { title: t("not_found_title"), robots: { index: false } };
  }

  const playerName = slugInfo.name;
  const title = t("player_page_meta_title", { playerName });
  const description = t("player_page_meta_description", { playerName });

  // --- UPDATED PATH ---
  const path = `/football/players/${slug.join("/")}`;

  const season = searchParams?.season as string | undefined;
  const pathWithQuery = season ? `${path}?season=${season}` : path;

  let canonicalUrl =
    locale === DEFAULT_LOCALE
      ? `${BASE_URL}${pathWithQuery}`
      : `${BASE_URL}/${locale}${pathWithQuery}`;

  // const hreflangAlternates = await generateHreflangTags(
  //   pathWithQuery,
  //   "",
  //   locale
  // );

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: { slug: string[]; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const slugInfo = parsePlayerSlug(slug);

  if (!slugInfo) notFound();

  const availableSeasons = await getPlayerSeasons(slugInfo.id);
  if (availableSeasons.length === 0) notFound();

  const selectedSeason = searchParams.season
    ? parseInt(searchParams.season as string)
    : availableSeasons[0];

  const playerData = await getPlayerPageData(
    slugInfo.id,
    selectedSeason.toString()
  );
  if (!playerData) notFound();

  const { player, statistics } = playerData.stats;
  const currentTeam = statistics?.[0]?.team;

  const pageUrl = `${BASE_URL}/${locale}/football/players/${slug.join("/")}`;
  const jsonLd: WithContext<Person | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: player.name,
      image: player.photo,
      nationality: player.nationality,
      birthDate: player.birth.date,
      height: player.height,
      weight: player.weight,
      affiliation: currentTeam
        ? { "@type": "SportsTeam", name: currentTeam.name }
        : undefined,
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
          name: t("players"),
          item: `${BASE_URL}/${locale}/football/players`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: player.name,
          item: pageUrl, // Add the URL for the current page
        },
      ],
    },
  ];

  return (
    <>
      <Script
        id="player-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start p-4 lg:py-6">
          <main className="min-w-0 space-y-8">
            <PlayerDetailView
              playerData={playerData}
              availableSeasons={availableSeasons}
              selectedSeason={selectedSeason}
            />
          </main>
          <aside className="hidden lg:block space-y-8 min-w-0 sticky top-6">
            <PlayerSidebar team={currentTeam} />
            <PlayerSeoWidget locale={locale} playerName={player.name} />
            <RecentNewsWidget />
            <AdSlotWidget location="player_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
