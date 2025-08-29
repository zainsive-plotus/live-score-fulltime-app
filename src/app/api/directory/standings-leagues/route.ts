import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";
import axios from "axios";
import { League } from "@/types/api-football";
import { topLeaguesConfig } from "@/config/topLeaguesConfig";

const FULL_LIST_CACHE_KEY = `leagues:directory:standings-full-list-v3`;
// ** THE FIX IS HERE: Cache duration changed from 1 day to 3 days **
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 3; // Cache the full list for 3 days

const fetchAndCacheFullLeagueList = async (): Promise<League[]> => {
  console.log(
    "[API/standings-leagues] Cache MISS. Fetching full list from external API."
  );

  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues`,
    {
      params: { current: "true" },
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    }
  );

  const allLeagues = response.data.response;
  const standingsLeagues = allLeagues.filter(
    (item: any) => item.league.type === "League"
  );

  const transformedData: League[] = standingsLeagues.map((item: any) => ({
    id: item.league.id,
    name: item.league.name,
    logoUrl: item.league.logo,
    countryName: item.country.name,
    countryFlagUrl: item.country.flag,
    type: item.league.type,
    href: `/football/standings/${generateStandingsSlug(
      item.league.name,
      item.league.id
    )}`,
  }));

  const popularLeagueIds = new Set(
    topLeaguesConfig.map((l) => parseInt(l.leagueId))
  );
  transformedData.sort((a, b) => {
    const isAPopular = popularLeagueIds.has(a.id);
    const isBPopular = popularLeagueIds.has(b.id);
    const aHasImage = !!a.logoUrl;
    const bHasImage = !!b.logoUrl;
    if (isAPopular !== isBPopular) return isAPopular ? -1 : 1;
    if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (transformedData.length > 0) {
    await redis.set(
      FULL_LIST_CACHE_KEY,
      JSON.stringify(transformedData),
      "EX",
      CACHE_TTL_SECONDS
    );
  }
  return transformedData;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "18");
    const skip = (page - 1) * limit;

    let allLeagues: League[] | null = null;
    const cachedData = await redis.get(FULL_LIST_CACHE_KEY);

    if (cachedData) {
      allLeagues = JSON.parse(cachedData);
    } else {
      allLeagues = await fetchAndCacheFullLeagueList();
    }

    if (!allLeagues) {
      return NextResponse.json(
        { error: "Could not retrieve league list." },
        { status: 500 }
      );
    }

    const paginatedLeagues = allLeagues.slice(skip, skip + limit);
    const totalCount = allLeagues.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      leagues: paginatedLeagues,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    console.error(
      "[API/standings-leagues] Error fetching paginated directory:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch directory of leagues." },
      { status: 500 }
    );
  }
}
