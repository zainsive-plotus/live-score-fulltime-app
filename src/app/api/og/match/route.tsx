// ===== src/app/api/og/match/route.tsx =====

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { FixtureImageTemplate } from "@/components/image-templates/FixtureImageTemplate";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parse all required parameters from the URL
  const homeTeamName = searchParams.get("homeTeamName");
  const homeTeamLogo = searchParams.get("homeTeamLogo");
  const awayTeamName = searchParams.get("awayTeamName");
  const awayTeamLogo = searchParams.get("awayTeamLogo");
  const leagueName = searchParams.get("leagueName");

  // Basic validation
  if (
    !homeTeamName ||
    !homeTeamLogo ||
    !awayTeamName ||
    !awayTeamLogo ||
    !leagueName
  ) {
    return new Response("Missing required parameters", { status: 400 });
  }

  // Fetch fonts (as required by @vercel/og)
  const fontData = await fetch(
    new URL("../public/fonts/inter-v19-latin-800.woff", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <FixtureImageTemplate
        homeTeamName={homeTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamName={awayTeamName}
        awayTeamLogo={awayTeamLogo}
        leagueName={leagueName}
      />
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Poppins", // Matches the font-family in the template
          data: fontData,
          style: "normal",
          weight: 800,
        },
      ],
    }
  );
}
