// ===== src/app/api/admin/ticker-messages/translate/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TickerMessage from "@/models/TickerMessage";
import Language from "@/models/Language";
import { GoogleGenerativeAI } from "@google/generative-ai";
import redis from "@/lib/redis";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const CACHE_KEY_PREFIX = "ticker-messages:active:";

async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Return ONLY the translated text, without any quotes, labels, or extra formatting.

Text to translate: "${text}"`;

  const result = await model.generateContent(prompt);
  return (await result.response).text().trim().replace(/["']/g, "");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { sourceMessageId } = await request.json();
    if (!sourceMessageId) {
      return NextResponse.json({ error: "Source Message ID is required" }, { status: 400 });
    }

    await dbConnect();

    const sourceMessage = await TickerMessage.findById(sourceMessageId);

    if (!sourceMessage) {
      return NextResponse.json({ error: "Source message not found" }, { status: 404 });
    }

    // --- Start of Fix ---
    // Self-healing: Ensure the source message has a translationGroupId.
    // If it's missing (e.g., legacy data), assign its own _id as the group ID.
    if (!sourceMessage.translationGroupId) {
      console.warn(`Ticker message ${sourceMessage._id} was missing a translationGroupId. Self-healing.`);
      sourceMessage.translationGroupId = sourceMessage._id;
      await sourceMessage.save();
    }
    const groupId = sourceMessage.translationGroupId;
    // --- End of Fix ---

    const [allLanguages, existingTranslations] = await Promise.all([
      Language.find({ isActive: true }).lean(),
      TickerMessage.find({ translationGroupId: groupId }).lean(),
    ]);

    const sourceLangDetails = allLanguages.find(lang => lang.code === (sourceMessage.language ?? 'en') );
    if (!sourceLangDetails) {
        return NextResponse.json({ error: `Source language code '${sourceMessage.language}' could not be found in the database.` }, { status: 400 });
    }

    const existingLangCodes = new Set(existingTranslations.map(t => t.language));
    const targetLanguages = allLanguages.filter(lang => !existingLangCodes.has(lang.code));

    if (targetLanguages.length === 0) {
      return NextResponse.json({ message: "All active languages are already translated." });
    }

    let translatedCount = 0;
    const translationPromises = targetLanguages.map(async (targetLang) => {
      const translatedText = await translateText(sourceMessage.message, sourceLangDetails.name, targetLang.name);

      const newMessage = new TickerMessage({
        message: translatedText,
        language: targetLang.code,
        translationGroupId: groupId, // Use the now-guaranteed group ID
        isActive: sourceMessage.isActive,
        order: sourceMessage.order,
      });

      await newMessage.save();
      await redis.del(`${CACHE_KEY_PREFIX}${targetLang.code}`);
      translatedCount++;
    });

    await Promise.allSettled(translationPromises);

    return NextResponse.json({ message: `Successfully created ${translatedCount} new translation(s).` });

  } catch (error: any) {
    console.error("[API/ticker-messages/translate] Error:", error.message);
    return NextResponse.json({ error: "Failed to generate translations." }, { status: 500 });
  }
}