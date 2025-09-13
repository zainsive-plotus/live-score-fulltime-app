import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  // 1. Check if user is an admin
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Check for a secret token (optional but recommended)
  const secret = request.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json(
      { error: "Invalid secret token" },
      { status: 401 }
    );
  }

  // 3. Get the tag to revalidate from the request body
  const { tag } = await request.json();
  if (!tag) {
    return NextResponse.json({ error: "Tag is required" }, { status: 400 });
  }

  // 4. Revalidate the tag
  try {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag: tag, now: Date.now() });
  } catch (error) {
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 });
  }
}
