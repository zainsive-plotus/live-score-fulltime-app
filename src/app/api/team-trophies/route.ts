// src/app/api/team-trophies/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("team");

  if (!teamId) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/trophies`,
    params: { team: teamId },
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  };

  try {
    const response = await axios.request(options);
    // Sort trophies by season, newest first
    const sortedTrophies = response.data.response.sort((a: any, b: any) => {
      const seasonB = parseInt(b.season.split("-")[0]);
      const seasonA = parseInt(a.season.split("-")[0]);
      return seasonB - seasonA;
    });
    return NextResponse.json(sortedTrophies);
  } catch (error) {
    console.error("Error fetching team trophies:", error);
    return NextResponse.json(
      { error: "Failed to fetch trophies" },
      { status: 500 }
    );
  }
}
