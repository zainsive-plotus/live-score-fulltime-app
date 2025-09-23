// ===== src/app/api/admin/redirects/cache/route.ts (NEW FILE) =====

import { NextResponse } from "next/server";
import { updateRedirectCache } from "@/lib/redirect-cache";

// --- DELETE (clear) the entire redirect cache ---
export async function DELETE(request: Request) {
  // Add admin session check here
  await updateRedirectCache();
  return NextResponse.json({
    message: "Redirect cache has been cleared and rebuilt.",
  });
}
