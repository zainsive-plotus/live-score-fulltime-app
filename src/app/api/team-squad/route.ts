// ===== src/app/api/team-squad/route.ts =====
import { NextResponse } from "next/server";
import { getTeamSquad } from "@/lib/data/player";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  if (!teamId) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  try {
    const squadData = await getTeamSquad(parseInt(teamId));
    if (!squadData) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(squadData[0]?.players || []);
  } catch (error) {
    console.error(
      `[API/team-squad] Failed to get squad for team ${teamId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch team squad." },
      { status: 500 }
    );
  }
}
