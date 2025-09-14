import "server-only";
import redis from "@/lib/redis";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";
import axios from "axios";
import { League } from "@/types/api-football";
import { topLeaguesConfig } from "@/config/topLeaguesConfig";

const FULL_LIST_CACHE_KEY = `leagues:directory:standings-full-list-v4`;
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 3; // Cache for 3 days

const fetchAndCacheFullLeagueList = async (): Promise<League[]> => {
  console.log(
    "[data/directory] Cache MISS for standings leagues. Fetching from external API."
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

interface GetStandingsLeaguesParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export const getStandingsLeagues = async ({
  page = 1,
  limit = 18,
  searchQuery = "",
}: GetStandingsLeaguesParams) => {
  let allLeagues: League[] | null = null;
  try {
    const cachedData = await redis.get(FULL_LIST_CACHE_KEY);
    if (cachedData) {
      allLeagues = JSON.parse(cachedData);
    }
  } catch (e) {
    console.error(
      "[data/directory] Redis GET failed for standings leagues:",
      e
    );
  }

  if (!allLeagues) {
    allLeagues = await fetchAndCacheFullLeagueList();
  }

  const filteredLeagues = searchQuery
    ? allLeagues.filter(
        (league) =>
          league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          league.countryName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allLeagues;

  const skip = (page - 1) * limit;
  const paginatedLeagues = filteredLeagues.slice(skip, skip + limit);
  const totalCount = filteredLeagues.length;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    leagues: paginatedLeagues,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
    },
  };
};
