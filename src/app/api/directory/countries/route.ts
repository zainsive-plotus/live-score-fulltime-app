// src/app/api/directory/countries/route.ts
import { NextResponse, NextRequest } from "next/server"; // Import NextRequest
import axios from "axios";

// The GET function now accepts the 'request' object
export async function GET(request: NextRequest) {
  try {
    // --- THIS IS THE FIX ---
    // 1. Get the protocol (http or https) and host (localhost:3000 or your domain)
    //    from the incoming request headers. This is the most reliable method.
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");

    // 2. Construct the absolute URL for the internal API call.
    const internalApiUrl = `${protocol}://${host}/api/leagues?fetchAll=true`;

    // 3. Make the internal API call using the constructed URL.
    const leaguesResponse = await axios.get(internalApiUrl);
    const allLeagues = leaguesResponse.data;

    if (!allLeagues || allLeagues.length === 0) {
      return NextResponse.json([]);
    }

    const leagueCounts: { [key: string]: number } = {};
    allLeagues.forEach((league: any) => {
      if (league.countryName) {
        leagueCounts[league.countryName] =
          (leagueCounts[league.countryName] || 0) + 1;
      }
    });

    const countriesResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/countries`,
      {
        headers: {
          "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
        },
      }
    );

    const allCountries = countriesResponse.data.response;

    let enrichedCountries = allCountries
      .map((country: any) => ({
        name: country.name,
        code: country.code,
        flagUrl: country.flag,
        leagueCount: leagueCounts[country.name] || 0,
      }))
      .filter(
        (country: any) =>
          country.leagueCount > 0 &&
          country.name &&
          country.code &&
          country.flagUrl
      );

    enrichedCountries.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(enrichedCountries);
  } catch (error) {
    console.error("Error building country directory from all leagues:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", error.response?.data);
    }
    return NextResponse.json(
      { error: "Failed to build country directory." },
      { status: 500 }
    );
  }
}
