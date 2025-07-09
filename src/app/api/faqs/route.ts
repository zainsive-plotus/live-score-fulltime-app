// src/app/api/faqs/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Faq from "@/models/Faq";

// This route is PUBLIC. It should NOT have any admin checks.
// It fetches all FAQs where isActive is true, sorts them, and returns them.
export async function GET() {
  try {
    await dbConnect();

    const faqs = await Faq.find({ isActive: true })
      .sort({ category: 1, order: 1 }) // Sort by category, then by order
      .lean();

    return NextResponse.json(faqs);
  } catch (error) {
    console.error("[API/faqs] Error fetching public FAQs:", error);
    return NextResponse.json(
      { error: "Server error fetching FAQs." },
      { status: 500 }
    );
  }
}
