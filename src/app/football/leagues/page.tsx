// src/app/football/leagues/page.tsx
// This is now a Server Component. Removed "use client";
import { headers } from "next/headers"; // Used for locale detection on server if needed, though not directly for SEO text
import axios from "axios";
import type { Metadata } from "next"; // Import Metadata type

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueListClient from "@/components/LeagueListClient"; // <-- NEW IMPORT: Client Component
import { League } from "@/types/api-football"; // Assuming League type is accessible

// This ensures dynamic rendering for this page if it uses headers, cookies, etc.
// For metadata, it's often implicit, but explicit for page content.
export const dynamic = "force-dynamic";

// --- Server-side Data Fetching for Initial Leagues List ---
const fetchAllLeaguesServer = async (): Promise<League[]> => {
  const publicAppUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (!publicAppUrl) {
    console.error(
      "[Leagues Page Server] NEXT_PUBLIC_PUBLIC_APP_URL is not defined! Cannot fetch all leagues."
    );
    return [];
  }
  const apiUrl = `${publicAppUrl}/api/leagues?fetchAll=true`;
  console.log(
    `[Leagues Page Server] Attempting to fetch all leagues from internal API: ${apiUrl}`
  );
  try {
    const { data } = await axios.get(apiUrl, { timeout: 15000 }); // Increased timeout
    console.log(
      `[Leagues Page Server] Successfully fetched ${data.length} leagues.`
    );
    return data;
  } catch (error: any) {
    console.error(
      `[Leagues Page Server] Failed to fetch all leagues (${apiUrl}):`,
      error.message
    );
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "[Leagues Page Server] API Response Error (Status, Data):",
        error.response.status,
        error.response.data
      );
    }
    return [];
  }
};

// --- DYNAMIC METADATA GENERATION FOR LEAGUES PAGE ---
export async function generateMetadata(): Promise<Metadata> {
  const pageTitle =
    "All Football Leagues & Cups | Find Your Favorite Competition";
  const pageDescription =
    "Explore a comprehensive list of football leagues and cups from around the world. Find detailed information, standings, fixtures, and more for top divisions and international competitions.";

  // Construct Canonical URL
  const canonicalUrl = `/football/leagues`;

  console.log(
    `[Leagues Metadata] Generating metadata. Canonical: ${canonicalUrl}`
  );

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/football/leagues`,
      siteName: "Fan Skor",
      // images: [{ url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/og-image.jpg` }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      // images: [`${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/twitter-image.jpg`],
    },
  };
}

export default async function LeaguesPage() {
  console.log(
    "[Leagues Page Server] Rendering LeaguesPage (Server Component)."
  );

  // Fetch all leagues server-side
  const allLeagues = await fetchAllLeaguesServer();

  // --- Generate SEO Text for the page ---
  const leaguesPageSeoText = `Futbol dünyasının kalbine hoş geldiniz! Bu sayfada, en heyecan verici yerel liglerden prestijli uluslararası kupalara kadar, dünya genelindeki tüm futbol liglerini ve kupalarını keşfedebilirsiniz. Takımların güncel sıralamalarını, yaklaşan fikstürlerini ve tarihi istatistiklerini kolayca bulun. En sevdiğiniz ligin detaylı analizlerine dalın ve futbolun nabzını tutun.`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <h1 className="text-4xl font-extrabold text-white mb-6">
            Leagues & Cups
          </h1>

          {/* Render the SEO text from the server */}
          <p className="italic text-[#a3a3a3] leading-relaxed mb-8">
            {leaguesPageSeoText}
          </p>

          {/* Render the Client Component, passing the initial server-fetched data */}
          <LeagueListClient initialAllLeagues={allLeagues} />
        </main>
      </div>
    </div>
  );
}
