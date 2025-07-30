// ===== src/app/api/admin/ticker-messages/translate/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TickerMessage from "@/models/TickerMessage";
import Language from "@/models/Language";
import redis from "@/lib/redis";
import OpenAI from "openai"; // --- Import OpenAI ---

// --- Initialize OpenAI client ---
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const CACHE_KEY_PREFIX = "ticker-messages:active:";

// --- Rewritten for OpenAI ---
async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Return ONLY the translated text, without any quotes, labels, or extra formatting.

Text to translate: "${text}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const translatedText = response.choices[0]?.message?.content?.trim().replace(/["']/g, "");
  if (!translatedText) {
    throw new Error(`OpenAI failed to translate ticker message to ${targetLang}.`);
  }
  return translatedText;
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

    if (!sourceMessage.translationGroupId) {
      sourceMessage.translationGroupId = sourceMessage._id;
      await sourceMessage.save();
    }
    const groupId = sourceMessage.translationGroupId;

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
        translationGroupId: groupId,
        isActive: sourceMessage.isActive,
        order: sourceMessage.order,
      });

      await newMessage.save();
      if (redis.del) {
        await redis.del(`${CACHE_KEY_PREFIX}${targetLang.code}`);
      }
      translatedCount++;
    });

    await Promise.allSettled(translationPromises);

    return NextResponse.json({ message: `Successfully created ${translatedCount} new translation(s).` });

  } catch (error: any) {
    console.error("[API/ticker-messages/translate] Error:", error.message);
    return NextResponse.json({ error: "Failed to generate translations." }, { status: 500 });
  }
}