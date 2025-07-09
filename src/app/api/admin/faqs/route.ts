// src/app/api/admin/faqs/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Faq, { IFaq } from "@/models/Faq";

// GET all FAQs for the admin panel (includes inactive ones)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  // Sort by category first, then by order
  const faqs = await Faq.find({}).sort({ category: 1, order: 1, createdAt: 1 });
  return NextResponse.json(faqs);
}

// POST a new FAQ
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const body: Partial<IFaq> = await request.json();
    const newFaq = new Faq(body);
    await newFaq.save();
    return NextResponse.json(newFaq, { status: 201 });
  } catch (error: any) {
    console.error("[API/admin/faqs] POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create FAQ." },
      { status: 400 }
    );
  }
}

// PUT (update) an existing FAQ
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const body: IFaq = await request.json();

    // --- THIS IS THE FIX ---
    // Destructure 'category' from the body along with the other fields.
    const { _id, question, answer, category, order, isActive } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "FAQ ID is required for update." },
        { status: 400 }
      );
    }

    // Pass the 'category' to the update operation.
    const updatedFaq = await Faq.findByIdAndUpdate(
      _id,
      { question, answer, category, order, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedFaq) {
      return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
    }

    return NextResponse.json(updatedFaq);
  } catch (error: any) {
    console.error("[API/admin/faqs] PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update FAQ." },
      { status: 400 }
    );
  }
}

// DELETE an FAQ
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "FAQ ID is required for deletion." },
        { status: 400 }
      );
    }

    const deletedFaq = await Faq.findByIdAndDelete(id);

    if (!deletedFaq) {
      return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "FAQ deleted successfully." });
  } catch (error: any) {
    console.error("[API/admin/faqs] DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete FAQ." },
      { status: 500 }
    );
  }
}
