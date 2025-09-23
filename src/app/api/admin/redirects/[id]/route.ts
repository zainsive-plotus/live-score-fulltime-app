// ===== src/app/api/admin/redirects/[id]/route.ts (NEW FILE) =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Redirect from "@/models/Redirect";
import { updateRedirectCache } from "@/lib/redirect-cache";

interface Params {
  params: { id: string };
}

// --- PUT (update) a redirect ---
export async function PUT(request: Request, { params }: Params) {
  // Add admin session check here
  await dbConnect();
  const { id } = params;
  try {
    const body = await request.json();
    const updatedRedirect = await Redirect.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updatedRedirect) {
      return NextResponse.json(
        { error: "Redirect not found" },
        { status: 404 }
      );
    }
    await updateRedirectCache();
    return NextResponse.json(updatedRedirect);
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "One of the source paths is already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update redirect." },
      { status: 500 }
    );
  }
}

// --- DELETE a redirect ---
export async function DELETE(request: Request, { params }: Params) {
  // Add admin session check here
  await dbConnect();
  const { id } = params;
  const deletedRedirect = await Redirect.findByIdAndDelete(id);
  if (!deletedRedirect) {
    return NextResponse.json({ error: "Redirect not found" }, { status: 404 });
  }
  await updateRedirectCache();
  return NextResponse.json({ message: "Redirect deleted successfully." });
}
