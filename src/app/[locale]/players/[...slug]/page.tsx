// ===== src/app/[locale]/players/[...slug]/page.tsx (DEBUG VERSION) =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, Person, BreadcrumbList } from "schema-dts";
import { getI18n } from "@/lib/i18n/server";
import { getPlayerPageData, getPlayerSeasons } from "@/lib/data/player";
import { generateHreflangTags } from "@/lib/hreflang";
import Header from "@/components/Header";
import PlayerDetailView from "@/components/player/PlayerDetailView";
import PlayerSidebar from "@/components/player/PlayerSidebar";
import PlayerSeoWidget from "@/components/player/PlayerSeoWidget";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export const revalidate = 86400;

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const parsePlayerSlug = (
  slug: string[]
): { id: string; name: string } | null => {
  if (!slug || slug.length < 2) {
    console.error("[DEBUG] Slug parsing failed: slug array is invalid.", slug);
    return null;
  }
  const id = slug[0];
  const nameParts = slug.slice(1);

  if (!/^\d+$/.test(id)) {
    console.error(
      `[DEBUG] Slug parsing failed: ID part "${id}" is not a number.`
    );
    return null;
  }

  console.log(
    `[DEBUG] Slug parsed successfully: ID=${id}, Name=${nameParts.join("-")}`
  );
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

  const playerName = slugInfo.name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const title = t("player_page_meta_title", { playerName });
  const description = t("player_page_meta_description", { playerName });

  // --- Manually construct the canonical URL ---
  const path = `/players/${slug.join("/")}`;
  const season = searchParams?.season as string | undefined;

  let canonicalUrl =
    locale === DEFAULT_LOCALE
      ? `${BASE_URL}${path}`
      : `${BASE_URL}/${locale}${path}`;

  if (season) {
    canonicalUrl += `?season=${season}`;
  }
  // --- End of canonical URL construction ---

  return {
    title,
    description,
    // The alternates object is now much simpler
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl, // Use the canonical URL for Open Graph
      siteName: "Fanskor",
      type: "profile",
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
  console.log(`\n--- [DEBUG] Player Page Request ---`);
  console.log(`[DEBUG] Received params:`, await params);

  const { slug, locale } = params;
  const t = await getI18n(locale);

  // Test Slug Parsing
  const slugInfo = parsePlayerSlug(slug);
  if (!slugInfo) {
    console.error("[DEBUG] Triggering notFound() because slugInfo is null.");
    notFound();
  }

  // Test Season Data Fetching
  console.log(
    `[DEBUG] Fetching available seasons for player ID: ${slugInfo.id}`
  );
  const availableSeasons = await getPlayerSeasons(slugInfo.id);
  if (!availableSeasons || availableSeasons.length === 0) {
    console.error(
      `[DEBUG] Triggering notFound() because getPlayerSeasons returned an empty array for player ID: ${slugInfo.id}.`
    );
    notFound();
  }
  console.log(`[DEBUG] Found available seasons:`, availableSeasons);

  // Test Page Data Fetching for the selected season
  const selectedSeason = searchParams.season
    ? parseInt(searchParams.season as string)
    : availableSeasons[0];
  console.log(
    `[DEBUG] Fetching player page data for ID: ${slugInfo.id} and Season: ${selectedSeason}`
  );
  const playerData = await getPlayerPageData(
    slugInfo.id,
    selectedSeason.toString()
  );

  if (!playerData) {
    console.error(
      `[DEBUG] Triggering notFound() because getPlayerPageData returned null for player ID: ${slugInfo.id}, Season: ${selectedSeason}.`
    );
    notFound();
  }
  console.log(`[DEBUG] Successfully fetched player data. Rendering page.`);

  const { player, statistics } = playerData.stats;
  const currentTeam = statistics?.[0]?.team;

  // ... (rest of the component remains the same, including JSON-LD and JSX)
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
          item: `${BASE_URL}/${locale}/players`,
        },
        { "@type": "ListItem", position: 3, name: player.name },
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
            <PlayerSeoWidget locale={locale} playerName={player.name} />
          </main>
          <aside className="hidden lg:block space-y-8 min-w-0 sticky top-6">
            <PlayerSidebar team={currentTeam} />
          </aside>
        </div>
      </div>
    </>
  );
}
