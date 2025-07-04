// src/app/api/admin/casino-partners/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import CasinoPartner, { ICasinoPartner } from "@/models/CasinoPartner";

// GET handler to retrieve a list of all Casino Partners for admin
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    // Sort by 'order' ascending, then by 'createdAt' descending (newest first for same order)
    const partners = await CasinoPartner.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return NextResponse.json(partners, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching Casino Partners (Admin):", error.message);
    return NextResponse.json(
      { error: "Server error fetching Casino Partners." },
      { status: 500 }
    );
  }
}

// POST handler to create a new Casino Partner
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body: Partial<ICasinoPartner> = await request.json();
    const {
      name,
      logoUrl,
      redirectUrl,
      description,
      isFeatured,
      isActive,
      order,
    } = body;

    if (!name || !logoUrl || !redirectUrl) {
      return NextResponse.json(
        { error: "Name, Logo URL, and Redirect URL are required." },
        { status: 400 }
      );
    }

    const newPartner = new CasinoPartner({
      name,
      logoUrl,
      redirectUrl,
      description,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      isActive: isActive !== undefined ? isActive : true, // Default to active
      order: order !== undefined ? order : 0, // Default order
    });

    await newPartner.save();
    return NextResponse.json(newPartner, { status: 201 });
  } catch (error: any) {
    console.error("Error creating Casino Partner:", error.message);
    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json(
        { error: "Partner with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error creating Casino Partner." },
      { status: 500 }
    );
  }
}
