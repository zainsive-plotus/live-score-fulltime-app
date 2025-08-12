// ===== src/app/api/leagues/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/League";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import redis from "@/lib/redis";

const POPULAR_LEAGUE_IDS = new Set([39, 140, 135, 78, 61, 88, 94, 253, 203]);
const POPULAR_CUP_IDS = new Set([2, 3, 531, 45, 9, 11]);
const CACHE_TTL_SECONDS = 60 * 60 * 6;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // --- THIS IS THE FIX ---
  // Determine the request type and build the cache key and query accordingly.
  const fetchAll = searchParams.get("fetchAll") === "true";

  if (fetchAll) {
    // Logic for the "/football/leagues" page (paginated)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const searchQuery = searchParams.get("search") || "";
    const type = searchParams.get("type");

    const skip = (page - 1) * limit;
    const cacheKey = `leagues:db:paginated:p${page}:l${limit}:q${searchQuery}:t${
      type || "all"
    }`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }

      await dbConnect();
      const query: any = {};
      if (type && type !== "all") {
        query.type = type.charAt(0).toUpperCase() + type.slice(1);
      }
      if (searchQuery) {
        const regex = new RegExp(searchQuery, "i");
        query.$or = [
          { name: { $regex: regex } },
          { countryName: { $regex: regex } },
        ];
      }

      const [leaguesFromDB, totalCount] = await Promise.all([
        League.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
        League.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const transformedData = leaguesFromDB.map((league) => ({
        id: league.leagueId,
        name: league.name,
        logoUrl: league.logoUrl,
        countryName: league.countryName,
        countryFlagUrl: league.countryFlagUrl,
        type: league.type,
        href: generateLeagueSlug(league.name, league.leagueId),
      }));

      const responseData = {
        leagues: transformedData,
        pagination: { currentPage: page, totalPages, totalCount },
      };
      await redis.set(
        cacheKey,
        JSON.stringify(responseData),
        "EX",
        CACHE_TTL_SECONDS
      );
      return NextResponse.json(responseData);
    } catch (error) {
      console.error(`[API/leagues] Error fetching paginated leagues:`, error);
      return NextResponse.json(
        { error: "Failed to fetch league data." },
        { status: 500 }
      );
    }
  } else {
    // Logic for the Sidebar and other non-paginated views
    const country = searchParams.get("country");
    const type = searchParams.get("type");

    let cacheIdentifier = country
      ? country.toLowerCase().replace(/\s/g, "-")
      : "popular";
    const cacheKey = `leagues:db:non-paginated:${cacheIdentifier}:${
      type || "all"
    }`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }

      await dbConnect();
      const query: any = {};
      if (country) {
        query.countryName = country;
      }
      if (type) {
        query.type = type.charAt(0).toUpperCase() + type.slice(1);
      }
      if (!country) {
        const popularIds =
          type === "cup"
            ? Array.from(POPULAR_CUP_IDS)
            : Array.from(POPULAR_LEAGUE_IDS);
        query.leagueId = { $in: popularIds };
      }

      const leaguesFromDB = await League.find(query).sort({ name: 1 }).lean();
      const transformedData = leaguesFromDB.map((league) => ({
        id: league.leagueId,
        name: league.name,
        logoUrl: league.logoUrl,
        countryName: league.countryName,
        countryFlagUrl: league.countryFlagUrl,
        type: league.type,
        href: generateLeagueSlug(league.name, league.leagueId),
      }));

      await redis.set(
        cacheKey,
        JSON.stringify(transformedData),
        "EX",
        CACHE_TTL_SECONDS
      );
      return NextResponse.json(transformedData);
    } catch (error) {
      console.error(
        `[API/leagues] Error fetching non-paginated leagues:`,
        error
      );
      return NextResponse.json(
        { error: "Failed to fetch league data." },
        { status: 500 }
      );
    }
  }
  // --- END OF FIX ---
}
