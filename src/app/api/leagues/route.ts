// ===== src/app/api/leagues/route.ts (Redis Enhanced & Reimplemented) =====

import { NextResponse } from "next/server";
import axios from "axios";
import { League } from "@/types/api-football";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import redis from "@/lib/redis"; // Import our Redis client

const POPULAR_LEAGUE_IDS = new Set([39, 140, 135, 78, 61, 88, 94, 253, 203]);
const POPULAR_CUP_IDS = new Set([2, 3, 531, 45, 9, 11]);
const CACHE_TTL_SECONDS = 60 * 60 * 24; // Cache data for 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const type = searchParams.get("type");
  const fetchAll = searchParams.get("fetchAll");

  // 1. Create a unique cache key based on the request parameters.
  // This ensures that different requests (e.g., for popular vs. all leagues) are cached separately.
  const cacheKey = `leagues:${fetchAll ? 'all' : country || 'popular'}:${type || 'all'}`;

  try {
    // 2. Check Redis for cached data first.
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache HIT] Returning cached data for key: ${cacheKey}`);
      // If found, parse it and return it immediately. This is the fast path.
      return NextResponse.json(JSON.parse(cachedData));
    }

    // 3. If no data is in the cache (Cache Miss), fetch fresh data from the external API.
    console.log(`[Cache MISS] Fetching fresh data for key: ${cacheKey}`);
    
    const params: { current: string; country?: string; type?: string } = {
      current: "true",
    };
    if (country) params.country = country;
    if (type) params.type = type;

    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues`,
      params: params,
      headers: {
        "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
      },
    };

    const response = await axios.request(options);
    let allLeagues = response.data.response;

    // Filter for popular leagues if no specific country/fetchAll is requested.
    if (!country && !fetchAll) {
      const popularIds = type === "cup" ? POPULAR_CUP_IDS : POPULAR_LEAGUE_IDS;
      allLeagues = allLeagues.filter((item: any) =>
        popularIds.has(item.league.id)
      );
    }

    // Transform the data into our desired format.
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
        href: generateLeagueSlug(item.league.name, item.league.id),
      }));

    transformedData.sort((a, b) => a.name.localeCompare(b.name));

    // 4. Store the newly fetched and transformed data in Redis with an expiration time (TTL).
    // This ensures future requests will be served from the cache.
    if (transformedData.length > 0) {
        await redis.set(cacheKey, JSON.stringify(transformedData), "EX", CACHE_TTL_SECONDS);
        console.log(`[Cache SET] Stored fresh data for key: ${cacheKey}`);
    }

    // 5. Return the fresh data to the client.
    return NextResponse.json(transformedData);
    
  } catch (error) {
    console.error(`[API/leagues] Error fetching league data:`, error);
    return NextResponse.json(
      { error: "Failed to fetch league data." },
      { status: 500 }
    );
  }
}