// ===== src/app/api/directory/standings-leagues/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import redis from "@/lib/redis";
import { generateLeagueSlug } from "@/lib/generate-league-slug";

// A curated list of popular leagues that typically have standings
const STANDINGS_LEAGUE_IDS = new Set([
  39, // Premier League (England)
  140, // La Liga (Spain)
  135, // Serie A (Italy)
  78, // Bundesliga (Germany)
  61, // Ligue 1 (France)
  2, // Champions League
  3, // Europa League
  88, // Eredivisie (Netherlands)
  94, // Primeira Liga (Portugal)
  203, // Super Lig (Turkey)
  253, // MLS (USA)
  262, // Liga MX (Mexico)
  71, // Serie A (Brazil)
  128, // Copa Libertadores
  130, // Copa Sudamericana
]);

const CACHE_KEY = `leagues:directory:standings`;
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function GET() {
  try {
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues`,
      params: { current: "true" }, // Fetch all current leagues
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    };

    const response = await axios.request(options);

    // Filter the massive response down to only the leagues we care about
    const popularLeagues = response.data.response.filter(
      (item: any) =>
        STANDINGS_LEAGUE_IDS.has(item.league.id) &&
        item.league.type === "League"
    );

    const transformedData = popularLeagues.map((item: any) => ({
      id: item.league.id,
      name: item.league.name,
      logoUrl: item.league.logo,
      countryName: item.country.name,
      countryFlagUrl: item.country.flag,
      type: item.league.type,
      href: `/football/standings/${generateLeagueSlug(
        item.league.name,
        item.league.id
      )
        .split("/")
        .pop()}`,
    }));

    // Sort alphabetically by league name
    transformedData.sort((a, b) => a.name.localeCompare(b.name));

    if (transformedData.length > 0) {
      await redis.set(
        CACHE_KEY,
        JSON.stringify(transformedData),
        "EX",
        CACHE_TTL_SECONDS
      );
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[API/directory/standings-leagues] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch directory of leagues with standings." },
      { status: 500 }
    );
  }
}
