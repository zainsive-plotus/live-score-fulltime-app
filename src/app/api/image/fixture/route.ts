// ===== src/app/api/image/fixture/route.tsx =====

import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { FixtureImageTemplate } from "@/components/image-templates/FixtureImageTemplate";

// Tell Next.js to run this function on the high-performance edge runtime
export const runtime = "edge";

// Helper function to fetch an image and convert it to a data URL
async function getImageDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString(
      "base64"
    )}`;
  } catch (error) {
    console.error(`Error fetching image data for ${url}:`, error);
    // Return a 1x1 transparent pixel as a placeholder on failure
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Get all required parameters from the URL
    const homeTeamName = searchParams.get("homeName") || "Home Team";
    const homeTeamLogoUrl = searchParams.get("homeLogo") || "";
    const awayTeamName = searchParams.get("awayName") || "Away Team";
    const awayTeamLogoUrl = searchParams.get("awayLogo") || "";
    const leagueName = searchParams.get("leagueName") || "Match";

    // Fetch font data from Google Fonts
    const fontFetchUrl =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@700;900&display=swap";
    const fontCss = await (
      await fetch(fontFetchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
        },
      })
    ).text();

    const fontUrlRegex = /src: url\((.+?)\)/g;
    const fontUrls = Array.from(fontCss.matchAll(fontUrlRegex)).map(
      (match) => match[1]
    );

    const poppinsBoldUrl = fontUrls.find((url) =>
      url.includes("v20-latin-700")
    );
    const poppinsBlackUrl = fontUrls.find((url) =>
      url.includes("v20-latin-900")
    );

    if (!poppinsBoldUrl || !poppinsBlackUrl) {
      throw new Error("Could not parse font URLs from Google Fonts CSS.");
    }

    // Fetch fonts and logos in parallel for maximum performance
    const [homeLogoData, awayLogoData, fontBold, fontBlack] = await Promise.all(
      [
        getImageDataUrl(homeTeamLogoUrl),
        getImageDataUrl(awayTeamLogoUrl),
        fetch(poppinsBoldUrl).then((res) => res.arrayBuffer()),
        fetch(poppinsBlackUrl).then((res) => res.arrayBuffer()),
      ]
    );

    return new ImageResponse(
      (
        <FixtureImageTemplate
          homeTeamName={homeTeamName}
          homeTeamLogo={homeLogoData}
          awayTeamName={awayTeamName}
          awayTeamLogo={awayLogoData}
          leagueName={leagueName}
        />
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Poppins",
            data: fontBold,
            style: "normal",
            weight: 700,
          },
          {
            name: "Poppins",
            data: fontBlack,
            style: "normal",
            weight: 900,
          },
        ],
      }
    );
  } catch (e: any) {
    console.error(
      `[ImageResponse Error] Failed to generate fixture image: ${e.message}`
    );
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
