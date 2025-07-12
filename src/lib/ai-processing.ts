// ===== src/lib/ai-processing.ts =====

import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle, {
  IExternalNewsArticle,
} from "@/models/ExternalNewsArticle";
import Post, { NewsType, SportsCategory } from "@/models/Post";
import AIJournalist from "@/models/AIJournalist";
import TitleTemplate from "@/models/TitleTemplate";
import { GoogleGenerativeAI } from "@google/generative-ai";
import slugify from "slugify";
import { proxyAndUploadImage } from "./image-processing-server";
import axios from "axios"; // ADDED

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

async function generateHumanizedTitle(
  originalTitle: string,
  originalDescription: string,
  journalistName?: string,
  template?: string
): Promise<string> {
  let prompt: string;

  if (template) {
    prompt = `
      You are a title generation assistant. Your ONLY task is to use the provided template and context to generate a final, clean news title in TURKISH.

      TEMPLATE:
      "${template}"

      CONTEXT:
      - {original_title}: "${originalTitle}"
      - {original_description}: "${
        originalDescription || "No description available."
      }"
      - {journalist_name}: "${journalistName || "Fanskor AI"}"

      INSTRUCTIONS:
      1. Replace the placeholders in the TEMPLATE with the values from the CONTEXT.
      2. Output ONLY the final, generated title as a single line of plain text.
      3. Do not add any extra words, explanations, or formatting like quotes or asterisks.

      FINAL TITLE:
    `;
  } else {
    prompt = `
      You are an expert Turkish sports journalist named "${
        journalistName || "Fanskor AI"
      }".
      Your ONLY task is to generate a new, original, and SEO-friendly news title in TURKISH based on the context below.

      GUIDELINES:
      1.  **Language:** The title MUST be in Turkish.
      2.  **Format:** Output MUST be plain text only, on a single line. NO HTML, NO Markdown, NO quotes.
      3.  **Humanize:** Do not just translate. Find a unique, emotional, or analytical angle.

      CONTEXT:
      - Original Title: "${originalTitle}"
      - Original Description: "${originalDescription}"

      YOUR GENERATED TURKISH TITLE:
    `;
  }

  const result = await model.generateContent(prompt);
  const responseText = (await result.response).text().trim();

  return responseText.replace(/[\*#"\n]/g, "");
}

// MODIFIED: Added highlightEmbedHtml parameter
async function generateExpandedContent(
  newTitle: string,
  originalContent: string,
  journalistName?: string,
  journalistTonePrompt?: string,
  highlightEmbedHtml?: string
): Promise<string> {
  const highlightInstruction = highlightEmbedHtml
    ? `
    **HIGHLIGHT EMBED:** A video highlight is provided in the "{highlight_embed_html}" placeholder. You MUST include this placeholder in your response. Place it in a logical position, such as after the introductory paragraph, to visually complement the text. Wrap it in a div like this for proper spacing: <div class="my-6">${highlightEmbedHtml}</div>
    `
    : "";

  const prompt = `
    You are an expert Turkish sports journalist named "${
      journalistName || "Fanskor AI"
    }" and an SEO specialist.
    Your unique journalistic voice and tone should be: ${
      journalistTonePrompt || "Objective and informative."
    }

    Your ONLY task is to expand upon the provided context and generate a comprehensive, 700-word news article formatted in PURE HTML.

    CRITICAL INSTRUCTIONS:
    1.  **HTML ONLY:** Your entire response MUST be valid HTML. Use tags like <h2>, <h3>, <p>, <strong>, and <ul>.
    2.  **NO WRAPPERS:** DO NOT include \`\`\`html, \`\`\`, \`<html>\`, \`<head>\`, or \`<body>\` tags. Your response must start directly with an HTML tag (e.g., <h2>).
    3.  **LANGUAGE:** The entire article must be in Turkish.
    4.  **EXPAND & ANALYZE:** The "Original Content" is a starting point. Your main job is to expand it into a full article. Add background details, analyze the impact, discuss what might happen next, and provide expert commentary. Create a complete narrative.
    5.  **SEO HIERARCHY:** Use the provided "New Turkish Title" as the conceptual H1. Structure the article with multiple <h2> and <h3> tags that use relevant keywords. Make the content rich and valuable for the reader.
    ${highlightInstruction}

    ARTICLE CONTEXT:
    - New Turkish Title: "${newTitle}"
    - Original Content: "${originalContent}"
    - Highlight Embed Code: "${highlightEmbedHtml || "Not available."}"

    YOUR GENERATED HTML ARTICLE:
  `;

  const result = await model.generateContent(prompt);
  return (await result.response)
    .text()
    .trim()
    .replace(/^```(?:html)?\n?|```$/g, "")
    .trim();
}

interface ProcessArticleOptions {
  journalistId?: string;
  titleTemplateId?: string;
  sportsCategory: SportsCategory[];
  newsType: NewsType;
  status: "draft" | "published";
  linkedFixtureId?: number; // ADDED
  onProgress?: (log: string) => void;
}

// MODIFIED: Now accepts a linkedFixtureId and fetches highlights
export async function processSingleArticle(
  externalArticle: IExternalNewsArticle,
  options: ProcessArticleOptions
): Promise<{ success: boolean; postId?: string; slug?: string }> {
  const { onProgress = () => {} } = options;

  try {
    onProgress("Initializing...");
    await dbConnect();

    if (["processed", "processing"].includes(externalArticle.status)) {
      const message = `Article already processed (Status: ${externalArticle.status}). Skipping.`;
      onProgress(message);
      return {
        success: true,
        postId: externalArticle.processedPostId?.toString(),
      };
    }

    onProgress("Updating article status to 'processing'...");
    externalArticle.status = "processing";
    await externalArticle.save();

    onProgress("Fetching AI Journalist details...");
    const journalist = options.journalistId
      ? await AIJournalist.findById(options.journalistId)
      : null;
    onProgress(`-> Using journalist: ${journalist?.name || "Default AI"}`);

    let titleTemplateContent: string | undefined = undefined;
    if (options.titleTemplateId) {
      onProgress("Fetching title template...");
      const titleTemplate = await TitleTemplate.findById(
        options.titleTemplateId
      );
      if (titleTemplate && titleTemplate.isActive) {
        titleTemplateContent = titleTemplate.template;
        onProgress(`-> Using title template: "${titleTemplate.name}"`);
      } else {
        onProgress(
          `-> Warning: Template not found or inactive. Reverting to dynamic title generation.`
        );
      }
    } else {
      onProgress("No title template selected. Using dynamic generation.");
    }

    // ADDED: Logic to fetch highlight embed code
    let highlightEmbedHtml: string | undefined;
    if (options.newsType === "reviews" && options.linkedFixtureId) {
      onProgress(
        `Fetching highlights for fixture ID: ${options.linkedFixtureId}...`
      );
      try {
        const highlightsApiUrl = `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/highlights?fixtureId=${options.linkedFixtureId}`;
        const { data } = await axios.get(highlightsApiUrl);
        const mainHighlight = data?.highlights?.[0];
        if (mainHighlight?.embedUrl) {
          highlightEmbedHtml = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0;"><iframe src="${mainHighlight.embedUrl}" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
          onProgress("-> Highlight video found and embed code generated.");
        } else {
          onProgress("-> No highlights found for this fixture.");
        }
      } catch (e) {
        onProgress("-> Could not fetch highlights for this fixture.");
      }
    }

    onProgress("Generating new article title with AI...");
    const newTitle = await generateHumanizedTitle(
      externalArticle.title,
      externalArticle.description || "",
      journalist?.name,
      titleTemplateContent
    );
    if (!newTitle) throw new Error("AI failed to generate a title.");
    onProgress(`-> Generated Title: "${newTitle}"`);

    onProgress("Generating full article content with AI...");
    const newContent = await generateExpandedContent(
      newTitle,
      externalArticle.content ||
        externalArticle.description ||
        "No content provided.",
      journalist?.name,
      journalist?.tonePrompt,
      highlightEmbedHtml // Pass embed code to content generator
    );
    if (!newContent || !newContent.includes("<p>"))
      throw new Error("AI failed to generate valid HTML content.");
    onProgress(
      `-> Generated content successfully (Length: ${newContent.length}).`
    );

    let featuredImageUrl: string | null = null;
    if (externalArticle.imageUrl) {
      onProgress("Processing and uploading featured image...");
      featuredImageUrl = await proxyAndUploadImage(
        externalArticle.imageUrl,
        newTitle
      );
      onProgress(
        featuredImageUrl
          ? "-> Image uploaded successfully."
          : "-> Image upload failed, continuing without it."
      );
    } else {
      onProgress("No featured image provided, skipping upload.");
    }

    onProgress("Creating post slug and checking for duplicates...");
    const slug = slugify(newTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const existingPost = await Post.findOne({ slug });
    const finalSlug = existingPost
      ? `${slug}-${Date.now().toString().slice(-5)}`
      : slug;
    onProgress(`-> Final slug: "${finalSlug}"`);

    onProgress("Saving new post to database...");
    const plainTextContent = newContent.replace(/<[^>]*>?/gm, "");
    const newPost = new Post({
      title: newTitle,
      content: newContent,
      slug: finalSlug,
      author: journalist?.name || "Fanskor AI",
      featuredImage: featuredImageUrl,
      featuredImageTitle: newTitle,
      featuredImageAltText: newTitle,
      isAIGenerated: true,
      originalExternalArticleId: externalArticle._id,
      metaTitle: `${newTitle} | Haberler`,
      metaDescription: plainTextContent.substring(0, 160) + "...",
      status: options.status,
      sportsCategory: options.sportsCategory,
      newsType: options.newsType,
      linkedFixtureId: options.linkedFixtureId, // Save the linked fixture ID
    });
    await newPost.save();
    onProgress("-> New post saved successfully.");

    onProgress("Finalizing article status...");
    externalArticle.status = "processed";
    externalArticle.processedPostId = newPost._id;
    await externalArticle.save();

    onProgress("✓ Generation Complete!");
    return {
      success: true,
      postId: newPost._id.toString(),
      slug: newPost.slug,
    };
  } catch (error: any) {
    const errorMessage = `✗ ERROR: ${error.message}`;
    onProgress(errorMessage);
    console.error(
      `[AI Processor] Failed to process article ${externalArticle.articleId}:`,
      error
    );
    externalArticle.status = "error";
    await externalArticle.save();
    return { success: false };
  }
}
