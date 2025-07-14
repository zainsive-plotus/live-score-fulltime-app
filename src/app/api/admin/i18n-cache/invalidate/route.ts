import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { i18nCache } from "@/lib/i18n/i18n.cache";

/**
 * An admin-only API endpoint to manually trigger a reload of the i18n cache.
 * This should be called after any changes to languages or translation files.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    console.log("[API] Received request to invalidate i18n cache.");
    await i18nCache.reload();
    console.log("[API] I18n cache successfully invalidated and reloaded.");

    return NextResponse.json(
      {
        success: true,
        message: "i18n cache has been successfully invalidated and reloaded.",
        loadedLocales: i18nCache.getLocales(),
        defaultLocale: i18nCache.getDefaultLocale(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API] Failed to invalidate i18n cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to invalidate cache due to a server error.",
      },
      { status: 500 }
    );
  }
}
