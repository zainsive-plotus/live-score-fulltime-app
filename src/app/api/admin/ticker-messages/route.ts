// ===== src/app/api/admin/ticker-messages/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TickerMessage from "@/models/TickerMessage";
import redis from "@/lib/redis";
import mongoose from "mongoose";

const CACHE_KEY_PREFIX = "ticker-messages:active:";

const invalidateCache = async (locale: string) => {
  await redis.del(`${CACHE_KEY_PREFIX}${locale}`);
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  const messages = await TickerMessage.find({}).sort({ order: 1, createdAt: -1 });
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await dbConnect();

    // --- Start of Fix ---
    // The previous logic was flawed. This new logic correctly handles group IDs.
    const newMessage = new TickerMessage(body);

    // If a translationGroupId is NOT provided, it means this is a new "master" message.
    // We create a new ObjectId for it.
    if (!body.translationGroupId) {
      newMessage.translationGroupId = new mongoose.Types.ObjectId();
    }
    // --- End of Fix ---

    await newMessage.save();
    await invalidateCache(newMessage.language);
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    // Provide more specific error feedback for validation issues.
    if (error instanceof mongoose.Error.ValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create message." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { _id, ...updateData } = body;
    await dbConnect();
    const updatedMessage = await TickerMessage.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
    if (!updatedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    await invalidateCache(updatedMessage.language);
    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    await dbConnect();
    const deletedMessage = await TickerMessage.findByIdAndDelete(id);
    if (!deletedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    await invalidateCache(deletedMessage.language);
    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}