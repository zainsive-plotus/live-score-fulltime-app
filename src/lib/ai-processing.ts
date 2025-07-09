// src/lib/ai-processing.ts
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle, {
  IExternalNewsArticle,
} from "@/models/ExternalNewsArticle";
import Post, { PostCategory } from "@/models/Post";
import { GoogleGenerativeAI } from "@google/generative-ai";
import slugify from "slugify";
import { proxyAndUploadImage } from "./image-processing-server"; // Assuming image processing is refactored

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// --- STAGE 1: TITLE HUMANIZER FUNCTION ---
async function generateHumanizedTitle(
  originalTitle: string,
  originalDescription: string
): Promise<string> {
  const prompt = `
    You are an expert Turkish sports journalist and a master of crafting captivating headlines.
    Your ONLY task is to generate a new, original, and SEO-friendly news title in TURKISH.
    
    GUIDELINES:
    1.  **Language:** The title MUST be in Turkish.
    2.  **Format:** Output MUST be plain text only, on a single line. NO HTML, NO Markdown, NO quotes, NO prefixes like "Title: ".
    3.  **Humanize:** Do not just translate. Find a unique, emotional, or analytical angle based on the context. Ask a question, create intrigue, or state a bold claim.
    4.  **SEO:** Naturally include the most important entities (team or player names).

    CONTEXT:
    - Original Title: "${originalTitle}"
    - Original Description: "${originalDescription}"

    YOUR GENERATED TURKISH TITLE:
  `;

  const result = await model.generateContent(prompt);
  const responseText = (await result.response).text().trim();

  // Clean up any accidental markdown or newlines
  return responseText.replace(/[\*#"\n]/g, "");
}

// --- STAGE 2: CONTENT EXPANDER FUNCTION ---
async function generateExpandedContent(
  newTitle: string,
  originalDescription: string
): Promise<string> {
  const prompt = `
    You are an expert Turkish sports journalist and an SEO specialist.
    Your ONLY task is to expand upon the provided context and generate a comprehensive, 700-word news article formatted in PURE HTML.

    CRITICAL INSTRUCTIONS:
    1.  **HTML ONLY:** Your entire response MUST be valid HTML. Use tags like <h2>, <h3>, <p>, <strong>, and <ul>.
    2.  **NO WRAPPERS:** DO NOT include \`\`\`html, \`\`\`, \`<html>\`, \`<head>\`, or \`<body>\` tags. Your response must start directly with an HTML tag (e.g., <h2>).
    3.  **LANGUAGE:** The entire article must be in Turkish.
    4.  **EXPAND & ANALYZE:** The "Original Description" is just a starting point. Your main job is to expand it into a full article. Add background details, analyze the impact, discuss what might happen next, and provide expert commentary. Create a complete narrative.
    5.  **SEO HIERARCHY:** Use the provided "New Turkish Title" as the conceptual H1. Structure the article with multiple <h2> and <h3> tags that use relevant keywords. Make the content rich and valuable for the reader.

    ARTICLE CONTEXT:
    - New Turkish Title: "${newTitle}"
    - Original Description: "${originalDescription}"

    YOUR GENERATED HTML ARTICLE:
  `;

  const result = await model.generateContent(prompt);
  return (await result.response).text().trim();
}

/**
 * The main processing function, now orchestrating the two-stage AI pipeline.
 */
export async function processSingleArticle(
  externalArticle: IExternalNewsArticle
): Promise<{ success: boolean; postId?: string; slug?: string }> {
  await dbConnect();

  try {
    if (["processed", "processing"].includes(externalArticle.status)) {
      console.log(
        `[AI Processor] Skipping article ${externalArticle.articleId} (status: ${externalArticle.status})`
      );
      return { success: true };
    }

    externalArticle.status = "processing";
    await externalArticle.save();
    console.log(
      `[AI Processor] Stage 0: Starting processing for article: ${externalArticle.articleId}`
    );

    // --- STAGE 1 ---
    console.log(`[AI Processor] Stage 1: Generating humanized title...`);
    const newTitle = await generateHumanizedTitle(
      externalArticle.title,
      externalArticle.description || ""
    );
    if (!newTitle)
      throw new Error("Title generation failed to produce a response.");
    console.log(`[AI Processor] -> New Title: "${newTitle}"`);

    // --- STAGE 2 ---
    console.log(`[AI Processor] Stage 2: Expanding content...`);
    const newContent = await generateExpandedContent(
      newTitle,
      externalArticle.description || "No description provided."
    );
    if (!newContent || !newContent.includes("<p>"))
      throw new Error("Content generation failed to produce valid HTML.");
    console.log(
      `[AI Processor] -> Generated content length: ${newContent.length}`
    );

    // --- STAGE 3: Image Processing (using a placeholder for the refactored function) ---
    console.log(`[AI Processor] Stage 3: Processing image...`);
    const featuredImageUrl = externalArticle.imageUrl
      ? await proxyAndUploadImage(externalArticle.imageUrl, newTitle)
      : null;
    console.log(`[AI Processor] -> Image URL: ${featuredImageUrl || "None"}`);

    // --- STAGE 4: Database Save ---
    console.log(`[AI Processor] Stage 4: Saving new Post to database...`);
    const slug = slugify(newTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const existingPost = await Post.findOne({ slug });
    const finalSlug = existingPost
      ? `${slug}-${Date.now().toString().slice(-5)}`
      : slug;

    const newPost = new Post({
      title: newTitle,
      content: newContent,
      status: "draft", // Always save as draft for review
      slug: finalSlug,
      author: "Fanskor AI",
      featuredImage: featuredImageUrl,
      featuredImageTitle: newTitle,
      featuredImageAltText: newTitle,
      isAIGenerated: true,
      originalExternalArticleId: externalArticle._id,
      sport: (externalArticle.category || ["general"]) as PostCategory[],
      metaTitle: newTitle,
      metaDescription: newContent.replace(/<[^>]*>?/gm, "").substring(0, 160),
    });
    await newPost.save();

    externalArticle.status = "processed";
    externalArticle.processedPostId = newPost._id;
    await externalArticle.save();

    console.log(
      `[AI Processor] ✓ SUCCESS: Processed article ${externalArticle.articleId}. New Post ID: ${newPost._id}`
    );
    return {
      success: true,
      postId: newPost._id.toString(),
      slug: newPost.slug,
    };
  } catch (error: any) {
    console.error(
      `[AI Processor] ✗ ERROR: Failed to process article ${externalArticle.articleId}: ${error.message}`
    );
    externalArticle.status = "error";
    await externalArticle.save();
    return { success: false };
  }
}
