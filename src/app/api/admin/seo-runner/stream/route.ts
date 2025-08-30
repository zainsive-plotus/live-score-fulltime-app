// ===== src/app/api/admin/seo-runner/stream/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";
import {
  runSeoGenerationForEntity,
  TemplateNotFoundError,
  DataFetchError,
} from "@/lib/seo-engine";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const BATCH_DELAY_MS = 500; // 0.5 second delay between processing each entity

const getEntitiesForPageType = async (pageType: string) => {
  switch (pageType) {
    case "league-standings":
      const { data: leagueData } = await axios.get(
        `${BASE_URL}/api/directory/standings-leagues?limit=10000`
      );
      return leagueData.leagues || [];
    case "team-details":
      const { data: teamData } = await axios.get(
        `${BASE_URL}/api/directory/teams-all`
      );
      return teamData || [];
    default:
      throw new Error(`Unsupported pageType: ${pageType}`);
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const { pageType } = await request.json(); // We only need pageType now

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          );
        };

        try {
          sendEvent("info", {
            message: `Starting batch process for page type: ${pageType}`,
          });

          const entities = await getEntitiesForPageType(pageType);
          if (!entities || entities.length === 0) {
            throw new Error(`No entities found for page type: ${pageType}`);
          }

          sendEvent("success", {
            message: `Found ${entities.length} entities to process.`,
          });

          let successCount = 0;
          let failureCount = 0;

          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const entityId = (entity.id || entity.team.id).toString();
            const entityName = entity.name || entity.team.name;

            sendEvent("progress", {
              total: entities.length,
              current: i + 1,
              stage: `Processing: ${entityName}`,
            });

            try {
              // Call the robust central engine for each entity
              await runSeoGenerationForEntity({ pageType, entityId });
              sendEvent("success", {
                message: `✓ Successfully processed ${entityName}`,
              });
              successCount++;
            } catch (error: any) {
              // The engine throws specific errors, which we catch here
              sendEvent("error", {
                message: `✗ Failed to process ${entityName}: ${error.message}`,
              });
              failureCount++;
            }

            // Add a small delay between entities to be respectful to all APIs
            if (i < entities.length - 1) {
              await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
            }
          }

          sendEvent("done", {
            message: `Batch complete. Processed: ${successCount}, Failed: ${failureCount}.`,
          });
          controller.close();
        } catch (error: any) {
          console.error("[SEO Runner Stream] Critical Error:", error.message);
          sendEvent("error", {
            message: `A critical error occurred: ${error.message}`,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to start runner stream." },
      { status: 500 }
    );
  }
}
