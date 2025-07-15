import { NextResponse } from "next/server";
import axios from "axios";
import { League } from "@/types/api-football";
import { generateLeagueSlug } from "@/lib/generate-league-slug";

const POPULAR_LEAGUE_IDS = new Set([39, 140, 135, 78, 61, 88, 94, 253, 203]);

const POPULAR_CUP_IDS = new Set([2, 3, 531, 45, 9, 11]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const type = searchParams.get("type");
  const fetchAll = searchParams.get("fetchAll");

  const params: { current: string; country?: string; type?: string } = {
    current: "true",
  };

  if (country) {
    params.country = country;
  }
  if (type) {
    params.type = type;
  }

  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues`,
    params: params,
    headers: {
      "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    let allLeagues = response.data.response;

    if (!country && !fetchAll) {
      const popularIds = type === "cup" ? POPULAR_CUP_IDS : POPULAR_LEAGUE_IDS;
      allLeagues = allLeagues.filter((item: any) =>
        popularIds.has(item.league.id)
      );
    }

    const transformedData: League[] = allLeagues
      .filter(
        (item: any) => item.league.id && item.league.name && item.league.logo
      )
      .map((item: any) => ({
        id: item.league.id,
        name: item.league.name,
        logoUrl: item.league.logo,
        countryName: item.country.name,
        countryFlagUrl: item.country.flag,
        type: item.league.type,
        // REVERTED: The slug no longer contains the locale.
        // It now correctly generates a partial path like '/football/league/...'
        href: generateLeagueSlug(item.league.name, item.league.id),
      }));

    transformedData.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[API/leagues] Failed to fetch league data:", error);
    return NextResponse.json(
      { error: "Failed to fetch league data." },
      { status: 500 }
    );
  }
}
