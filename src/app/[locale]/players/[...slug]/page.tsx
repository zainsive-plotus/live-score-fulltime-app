// ===== src/app/[locale]/players/[...slug]/page.tsx =====
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, Person, BreadcrumbList } from "schema-dts";
import { getI18n } from "@/lib/i18n/server";
import { getPlayerPageData } from "@/lib/data/player";
import { generateHreflangTags } from "@/lib/hreflang";
import Header from "@/components/Header";
import PlayerDetailView from "@/components/player/PlayerDetailView"; // We will create this next
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";

export const revalidate = 86400; // Revalidate player pages once every 24 hours

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
}: {
  params: { slug: string[]; locale: string };
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

  const path = `/players/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(path, "", locale);

  return {
    title,
    description,
    alternates: hreflangAlternates,
    openGraph: {
      title,
      description,
      url: hreflangAlternates.canonical,
      siteName: "Fanskor",
      type: "profile",
    },
  };
}

export default async function PlayerPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const slugInfo = parsePlayerSlug(slug);

  if (!slugInfo) notFound();

  const playerData = await getPlayerPageData(slugInfo.id);
  if (!playerData) notFound();

  const { player, statistics } = playerData.stats;
  const currentTeam = statistics?.[0]?.team;

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
        }, // Assuming you will create a player directory page
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
            <PlayerDetailView playerData={playerData} />
          </main>
          <aside className="hidden lg:block space-y-8 min-w-0 sticky top-6">
            <RecentNewsWidget />
            <AdSlotWidget location="player_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
