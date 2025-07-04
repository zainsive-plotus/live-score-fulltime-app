// src/app/api/admin/casino-partners/[partnerId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import CasinoPartner, { ICasinoPartner } from "@/models/CasinoPartner";

interface Params {
  params: { partnerId: string };
}

// GET handler to retrieve a single Casino Partner (optional, but good for editing)
export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { partnerId } = params;
    const partner = await CasinoPartner.findById(partnerId).lean();

    if (!partner) {
      return NextResponse.json(
        { error: "Casino Partner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(partner, { status: 200 });
  } catch (error: any) {
    console.error(
      `Error fetching Casino Partner ${params.partnerId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Server error fetching Casino Partner." },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing Casino Partner
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { partnerId } = params;
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

    // Basic validation
    if (!name || !logoUrl || !redirectUrl) {
      return NextResponse.json(
        { error: "Name, Logo URL, and Redirect URL are required." },
        { status: 400 }
      );
    }

    const updatedPartner = await CasinoPartner.findByIdAndUpdate(
      partnerId,
      { name, logoUrl, redirectUrl, description, isFeatured, isActive, order },
      { new: true, runValidators: true } // Return the updated document, run schema validators
    );

    if (!updatedPartner) {
      return NextResponse.json(
        { error: "Casino Partner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPartner, { status: 200 });
  } catch (error: any) {
    console.error(
      `Error updating Casino Partner ${params.partnerId}:`,
      error.message
    );
    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json(
        { error: "Partner with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error updating Casino Partner." },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a Casino Partner
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { partnerId } = params;
    const deletedPartner = await CasinoPartner.findByIdAndDelete(partnerId);

    if (!deletedPartner) {
      return NextResponse.json(
        { error: "Casino Partner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Casino Partner deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      `Error deleting Casino Partner ${params.partnerId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Server error deleting Casino Partner." },
      { status: 500 }
    );
  }
}
