// ===== src/app/api/admin/posts/auto-translate/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
import Language from "@/models/Language";
import OpenAI from "openai";
import slugify from "slugify";
import mongoose from "mongoose";
import { translatePostWithGemini } from "@/lib/gemini"; // ADDED: Import the Gemini helper

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

// This is now the dedicated OpenAI translation function
const translatePostWithGPT = async (
  post: IPost,
  sourceLangName: string,
  targetLangName: string
): Promise<Partial<IPost>> => {
  const systemPrompt =
    "You are an expert multilingual translator specializing in high-quality blog content and SEO. Your task is to translate all provided fields of a news article accurately, preserving HTML structure and context.";

  const userPrompt = `
    ### INSTRUCTIONS ###
    1. Translate all text fields from the SOURCE LANGUAGE to the TARGET LANGUAGE.
    2. Your response MUST be a single, valid JSON object. Do not include any text outside of the JSON.
    3. The JSON object must have these exact keys: "title", "content", "metaTitle", "metaDescription".
    4. PRESERVE ALL HTML TAGS in the 'content' field exactly as they are. Only translate the text within the tags.
    5. Ensure the translated 'metaTitle' is 50-60 characters and 'metaDescription' is 150-160 characters for optimal SEO.
    6. Maintain a professional and engaging tone suitable for a sports news website.

    ### LANGUAGES ###
    - SOURCE LANGUAGE: ${sourceLangName}
    - TARGET LANGUAGE: ${targetLangName}

    ### CONTENT TO TRANSLATE (JSON) ###
    ${JSON.stringify(
      {
        title: post.title,
        content: post.content,
        metaTitle: post.metaTitle || post.title,
        metaDescription: post.metaDescription || "",
      },
      null,
      2
    )}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI response was empty.");
    }

    const parsed = JSON.parse(content);
    if (!parsed.title || !parsed.content) {
      throw new Error(
        "AI response was missing required JSON fields (title, content)."
      );
    }

    return parsed as Partial<IPost>;
  } catch (error: any) {
    console.error(
      `[GPT Translate Post Error] Failed to translate to ${targetLangName}:`,
      error.message
    );
    throw new Error(`GPT translation to ${targetLangName} failed.`);
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // MODIFIED: Destructure the 'engine' from the request body
    const { translationGroupId, engine = "gpt" } = await request.json();
    if (!translationGroupId) {
      return NextResponse.json(
        { error: "translationGroupId is required." },
        { status: 400 }
      );
    }
    if (engine !== "gpt" && engine !== "gemini") {
      return NextResponse.json(
        { error: "Invalid engine specified. Must be 'gpt' or 'gemini'." },
        { status: 400 }
      );
    }

    await dbConnect();

    const [postsInGroup, allActiveLanguages] = await Promise.all([
      Post.find({ translationGroupId }).lean(),
      Language.find({ isActive: true }).lean(),
    ]);

    const sourcePost = postsInGroup.find((p) => p.language === "en");
    if (!sourcePost) {
      return NextResponse.json(
        {
          error:
            "An English source post is required to translate from, but was not found in this group.",
        },
        { status: 404 }
      );
    }

    const sourceLangDoc = allActiveLanguages.find((l) => l.code === "en");
    if (!sourceLangDoc) {
      return NextResponse.json(
        { error: "The English language is not configured or inactive." },
        { status: 400 }
      );
    }

    const existingLangCodes = new Set(postsInGroup.map((p) => p.language));
    const targetLanguages = allActiveLanguages.filter(
      (lang) => !existingLangCodes.has(lang.code)
    );

    if (targetLanguages.length === 0) {
      return NextResponse.json({
        message: "All active languages are already translated for this post.",
      });
    }

    let translatedCount = 0;

    for (const targetLang of targetLanguages) {
      try {
        let translatedFields;
        // NEW: Conditional logic to select the translation engine
        if (engine === "gemini") {
          translatedFields = await translatePostWithGemini(
            sourcePost,
            sourceLangDoc.name,
            targetLang.name
          );
        } else {
          translatedFields = await translatePostWithGPT(
            sourcePost,
            sourceLangDoc.name,
            targetLang.name
          );
        }

        const newSlug = slugify(translatedFields.title || sourcePost.title, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });

        const slugExists = await Post.countDocuments({
          slug: newSlug,
          language: targetLang.code,
        });
        const finalSlug = slugExists
          ? `${newSlug}-${Date.now().toString().slice(-4)}`
          : newSlug;

        const newPost = new Post({
          ...sourcePost,
          _id: new mongoose.Types.ObjectId(),
          title: translatedFields.title,
          content: translatedFields.content,
          metaTitle: translatedFields.metaTitle,
          metaDescription: translatedFields.metaDescription,
          slug: finalSlug,
          language: targetLang.code,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await newPost.save();
        translatedCount++;
      } catch (error: any) {
        console.error(
          `Failed to create translation for ${targetLang.name} using ${engine}:`,
          error.message
        );
      }
    }

    return NextResponse.json({
      message: `Successfully created ${translatedCount} of ${
        targetLanguages.length
      } missing translations using ${engine.toUpperCase()}.`,
    });
  } catch (error: any) {
    console.error("[API/posts/auto-translate] Critical error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during translation." },
      { status: 500 }
    );
  }
}
