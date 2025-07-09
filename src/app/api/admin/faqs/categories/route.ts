// src/app/api/admin/faqs/categories/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Faq from "@/models/Faq";

// GET handler to fetch all unique category strings
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    // The .distinct() method is perfect for this. It returns an array of unique values for the specified field.
    const categories = await Faq.distinct("category");

    // Filter out any null/empty categories and sort them alphabetically
    const sortedCategories = categories.filter(Boolean).sort();

    return NextResponse.json(sortedCategories);
  } catch (error) {
    console.error("[API/faqs/categories] Error fetching categories:", error);
    return NextResponse.json(
      { error: "Server error fetching categories." },
      { status: 500 }
    );
  }
}
