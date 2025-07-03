// src/app/api/admin/process-external-news/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle, {
  IExternalNewsArticle,
} from "@/models/ExternalNewsArticle";
import Post from "@/models/Post";
import AIPrompt from "@/models/AIPrompt";
import AIJournalist from "@/models/AIJournalist";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios"; // Still needed for external fetches (images, web scraping)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import slugify from "slugify";
import * as cheerio from "cheerio"; // Re-imported for web scraping
import MarkdownIt from "markdown-it"; // Re-imported for HTML post-processing

// Initialize markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// --- S3 Client configuration ---
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
  },
});

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// --- Initialize Google Generative AI ---
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Fixed names for the AI prompts
const TITLE_PROMPT_NAME = "AI Title Generation";
const CONTENT_PROMPT_NAME = "AI Content Generation";

/**
 * Helper for Jaccard Similarity.
 * @param str1 First string.
 * @param str2 Second string.
 * @returns Jaccard similarity score (0.0 to 1.0).
 */
function calculateJaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(Boolean));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(Boolean));

  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

/**
 * Fetches content from a given URL and attempts to extract main article text.
 * @param url The URL to fetch.
 * @returns Extracted text content or null if failed.
 */
async function fetchAndExtractWebpageContent(
  url: string
): Promise<string | null> {
  try {
    console.log(
      `[Content Extraction Helper] Attempting to fetch content from: ${url}`
    );
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (response.status !== 200) {
      console.warn(
        `[Content Extraction Helper] Failed to fetch content from ${url}: Status ${response.status}`
      );
      return null;
    }

    const $ = cheerio.load(response.data);

    const contentSelectors = [
      "article",
      "main",
      ".article-content",
      ".post-content",
      ".entry-content",
      ".story-content",
      ".body-content",
      "#article-body",
      "#main-content",
      "#content",
      "p",
    ];

    let extractedText = "";
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        element
          .find(
            "script, style, header, footer, nav, aside, form, iframe, .ad-unit"
          )
          .remove();
        extractedText = element.text();
        if (extractedText.length > 200) {
          console.log(
            `[Content Extraction Helper] Found substantial content using selector: ${selector}`
          );
          break;
        }
      }
    }

    extractedText = extractedText.replace(/\s\s+/g, " ").trim();
    console.log(
      `[Content Extraction Helper] Extracted text length: ${extractedText.length}`
    );

    return extractedText.length > 0 ? extractedText : null;
  } catch (error: any) {
    console.error(
      `[Content Extraction Helper] Error fetching or extracting content from ${url}:`,
      error.message
    );
    return null;
  }
}

/**
 * Orchestrates AI title generation.
 * @param originalTitle The original news title.
 * @param originalDescription The original news description.
 * @param journalistId Optional ID of the AI Journalist to use.
 * @returns The AI-generated new title.
 * @throws Error if title generation fails or output is invalid.
 */
async function generateTitle(
  originalTitle: string,
  originalDescription: string,
  journalistId?: string
): Promise<string> {
  const titlePromptDoc = await AIPrompt.findOne({
    name: TITLE_PROMPT_NAME,
    type: "title",
  });
  if (!titlePromptDoc) {
    console.warn(
      `[AI Generate Title - Func] Title prompt "${TITLE_PROMPT_NAME}" (type 'title') not found. Using default internal prompt.`
    );
  }

  const defaultTitlePrompt =
    "YOUR ONLY TASK IS TO GENERATE A NEWS ARTICLE TITLE. Output MUST be plain text only, on a single line. NO HTML, NO Markdown. NO preambles. NO prefixes like 'Title: '.\n\n" +
    "You are an expert sports journalist. Generate a **new, original, SEO-friendly title** for a news article based on the following original title and description. The new title MUST be highly distinct from the original, capture a fresh angle, and avoid simply rephrasing original keywords.\n\n" +
    "Original Title: {original_title}\nOriginal Description: {original_description}\n\n" +
    "Generated Title:";

  let finalTitlePrompt = titlePromptDoc?.prompt || defaultTitlePrompt;

  let journalistTonePrompt = "";
  if (journalistId) {
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistTonePrompt = `As "${journalist.name}", your unique journalistic voice and tone should be: ${journalist.tonePrompt}\n\n`;
      console.log(
        `[AI Generate Title - Func] Using AI Journalist: ${journalist.name}`
      );
    }
  }

  const fullPrompt = `${journalistTonePrompt}${finalTitlePrompt}`
    .replace("{original_title}", originalTitle)
    .replace("{original_description}", originalDescription);

  // AI Call
  let aiResponseText: string = "";
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;
  const AI_CALL_TIMEOUT_MS = 20000; // 20 seconds for title generation

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(
        `[AI Generate Title - Func] Calling Gemini for title (Attempt ${
          i + 1
        })...`
      );
      const result = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("AI title generation timed out.")),
            AI_CALL_TIMEOUT_MS
          )
        ),
      ]);
      aiResponseText = (await result.response).text();
      console.log(
        `[AI Generate Title - Func] Received raw AI response. Length: ${aiResponseText.length}.`
      );
      break;
    } catch (aiError: any) {
      console.error(
        `[AI Generate Title - Func] Error in Gemini API call for title (Attempt ${
          i + 1
        }/${MAX_RETRIES}):`,
        aiError.message
      );
      if (
        i < MAX_RETRIES - 1 &&
        (aiError.message.includes("timed out.") ||
          aiError.status === 429 ||
          (aiError.status >= 500 && aiError.status < 600))
      ) {
        console.warn(
          `[AI Generate Title - Func] Retrying AI title generation in ${
            RETRY_DELAY_MS / 1000
          } seconds...`
        );
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      } else {
        throw new Error(
          `AI title generation failed after ${MAX_RETRIES} retries: ${aiError.message}`
        );
      }
    }
  }

  if (!aiResponseText) {
    throw new Error("AI title generation failed to produce a response.");
  }

  // --- Aggressive Title Cleanup and Validation ---
  let generatedTitle = aiResponseText.trim();
  generatedTitle = generatedTitle
    .replace(/^```(?:html|text|json)?\n?|```$/g, "")
    .trim();
  generatedTitle = generatedTitle
    .replace(
      /<!DOCTYPE html>[\s\S]*?<body[^>]*>|(?<=<\/body>)[\s\S]*$|<\/body>|<\/html>|<\/head>|<\/title>|<\/meta>|<\/link>|<\/style>|<style[^>]*>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>/g,
      ""
    )
    .trim();
  generatedTitle = generatedTitle
    .replace(/<html[^>]*>|<body[^>]*>/g, "")
    .trim();
  generatedTitle = generatedTitle.replace(/^\s*\n/gm, "").trim();
  generatedTitle = generatedTitle
    .replace(/^(AI JOURNALIST TONE & STYLE:[\s\S]*?\n\n)?/i, "")
    .trim();
  generatedTitle = generatedTitle
    .replace(
      /^(Here's the (title|article|rewritten title|news article|requested article|response)|Article Title|Generated Title|Title):?\s*\n*/i,
      ""
    )
    .trim();
  generatedTitle = generatedTitle.replace(/<[^>]*>?/gm, "");
  generatedTitle = generatedTitle.replace(/[\*_`#\[\]\n]/g, "");
  generatedTitle = generatedTitle.trim();

  console.log(
    `[AI Generate Title - Func] Cleaned generated title: "${generatedTitle}"`
  );

  // Strict validation
  const originalTitleLower = originalTitle.toLowerCase();
  const generatedTitleLower = generatedTitle.toLowerCase();
  const jaccardSimilarity = calculateJaccardSimilarity(
    originalTitleLower,
    generatedTitleLower
  );
  const SIMILARITY_THRESHOLD = 0.4;

  if (
    generatedTitle.length < 10 ||
    jaccardSimilarity > SIMILARITY_THRESHOLD ||
    generatedTitleLower === originalTitleLower
  ) {
    console.error(
      `[AI Generate Title - Func] Generated Title: "${generatedTitle}" (Original: "${originalTitle}")`
    );
    console.error(
      `[AI Generate Title - Func] Jaccard Similarity: ${jaccardSimilarity.toFixed(
        2
      )} (Threshold: ${SIMILARITY_THRESHOLD})`
    );
    throw new Error(
      `Generated title failed strict validation (too short, not unique, or too similar).`
    );
  }

  return generatedTitle;
}

/**
 * Orchestrates AI content generation.
 * @param originalTitle The original news title.
 * @param originalDescription The original news description.
 * @param originalContent The external article's content field.
 * @param articleLink The external article's link for scraping.
 * @param generatedTitle The title already generated by AI.
 * @param journalistId Optional ID of the AI Journalist to use.
 * @returns The AI-generated HTML content.
 * @throws Error if content generation fails or output is invalid.
 */
async function generateContent(
  originalTitle: string,
  originalDescription: string,
  originalContent: string | null,
  articleLink: string,
  generatedTitle: string,
  journalistId?: string
): Promise<string> {
  const contentPromptDoc = await AIPrompt.findOne({
    name: CONTENT_PROMPT_NAME,
    type: "content",
  });
  if (!contentPromptDoc) {
    console.warn(
      `[AI Generate Content - Func] Content prompt "${CONTENT_PROMPT_NAME}" (type 'content') not found. Using default internal prompt.`
    );
  }

  const defaultContentPrompt =
    "Your ONLY task is to generate a news article content in HTML. NO Markdown, NO preambles, NO extra text, NO code block wrappers (```html). DO NOT INCLUDE `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`, `<h1>`, or any other full document tags. \n\n" +
    "You are an expert sports journalist. Analyze the following news title, description, and provided context. Your goal is to generate a comprehensive, human-like, SEO-optimized HTML article, approximately 700 words long. Focus on deep insights, storytelling, and compelling analysis.\n\n" +
    "**GUIDELINES:**\n" +
    "1.  **HTML CONTENT:** Provide valid HTML. Use `<h2>` for main headings (optimized for keywords), `<p>` for paragraphs, `<strong>`, `<em>`, `<ul>`, `<li>`, `<a>`. Ensure natural flow, rich detail, and human tone. Integrate relevant keywords naturally throughout the article for SEO, but avoid stuffing.\n\n" +
    "**HTML Example Structure:**\n" +
    "<h2>Introduction Heading</h2><p>This is the engaging introduction paragraph...</p>\n" +
    "<h2>Key Developments</h2><p>Here's a detailed paragraph...</p><ul><li>...</li></ul><p>...</p><h2>Conclusion</h2><p>The concluding paragraph summarizes...</p>\n\n" +
    "**IMPORTANT:** If the provided content is too short or lacks sufficient detail for a 700-word SEO-optimized expansion, respond ONLY with 'CONTENT INSUFFICIENT FOR EXPANSION: [brief reason]'. No other text.\n\n" +
    "Generated Article Title: {generated_title}\nOriginal News Title: {original_title}\nOriginal News Description: {original_description}\nAdditional Context: {additional_context}";

  let finalContentPrompt = contentPromptDoc?.prompt || defaultContentPrompt;

  let journalistTonePrompt = "";
  if (journalistId) {
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistTonePrompt = `As "${journalist.name}", your unique journalistic voice and tone should be: ${journalist.tonePrompt}\n\n`;
      console.log(
        `[AI Generate Content - Func] Using AI Journalist: ${journalist.name}`
      );
    }
  }

  // --- Content Gathering for AI Input ---
  let combinedArticleContext = "";
  const MIN_TOTAL_CONTEXT_FOR_GENERATION = 100;

  if (originalTitle) combinedArticleContext += `Title: ${originalTitle}\n`;
  if (originalDescription)
    combinedArticleContext += `Description: ${originalDescription}\n`;
  if (originalContent && originalContent.length > 50) {
    combinedArticleContext += `\nFull Content: ${originalContent}\n`;
  }

  if (
    articleLink &&
    combinedArticleContext.length < MIN_TOTAL_CONTEXT_FOR_GENERATION
  ) {
    console.log(
      `[Content Gathering - Func] Combined context too short (${combinedArticleContext.length}), attempting to fetch from link: ${articleLink}`
    );
    const fetchedWebContent = await fetchAndExtractWebpageContent(articleLink);
    if (fetchedWebContent && fetchedWebContent.length > 50) {
      combinedArticleContext += `\nWebpage Context: ${fetchedWebContent}\n`;
      console.log(
        `[Content Gathering - Func] Successfully fetched and appended web content (total context length: ${combinedArticleContext.length})`
      );
    } else {
      console.log(
        "[Content Gathering - Func] No substantial web content extracted from link."
      );
    }
  }

  if (
    !combinedArticleContext ||
    combinedArticleContext.length < MIN_TOTAL_CONTEXT_FOR_GENERATION
  ) {
    throw new Error(
      "Article content (title, description, or external content) too short or missing to generate content."
    );
  }

  const MAX_CONTENT_LENGTH_TO_SEND = 8000;
  if (combinedArticleContext.length > MAX_CONTENT_LENGTH_TO_SEND) {
    combinedArticleContext =
      combinedArticleContext.substring(0, MAX_CONTENT_LENGTH_TO_SEND) +
      "... (truncated for AI processing)";
    console.warn(
      `[Content Gathering - Func] Article context truncated to ${MAX_CONTENT_LENGTH_TO_SEND} characters for AI.`
    );
  }

  const fullPrompt = `${journalistTonePrompt}${finalContentPrompt}`
    .replace("{generated_title}", generatedTitle)
    .replace("{original_title}", originalTitle)
    .replace("{original_description}", originalDescription)
    .replace("{additional_context}", combinedArticleContext);

  // AI Call
  let aiResponseText: string = "";
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;
  const AI_CALL_TIMEOUT_MS = 90000; // 90 seconds for content generation

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(
        `[AI Generate Content - Func] Calling Gemini for content (Attempt ${
          i + 1
        })...`
      );
      const result = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("AI content generation timed out.")),
            AI_CALL_TIMEOUT_MS
          )
        ),
      ]);
      aiResponseText = (await result.response).text();
      console.log(
        `[AI Generate Content - Func] Received raw AI response. Length: ${aiResponseText.length}.`
      );
      break;
    } catch (aiError: any) {
      console.error(
        `[AI Generate Content - Func] Error in Gemini API call for content (Attempt ${
          i + 1
        }/${MAX_RETRIES}):`,
        aiError.message
      );
      if (
        i < MAX_RETRIES - 1 &&
        (aiError.message.includes("timed out.") ||
          aiError.status === 429 ||
          (aiError.status >= 500 && aiError.status < 600))
      ) {
        console.warn(
          `[AI Generate Content - Func] Retrying AI content generation in ${
            RETRY_DELAY_MS / 1000
          } seconds...`
        );
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      } else {
        throw new Error(
          `AI content generation failed after ${MAX_RETRIES} retries: ${aiError.message}`
        );
      }
    }
  }

  if (!aiResponseText) {
    throw new Error("AI content generation failed to produce a response.");
  }

  // --- Aggressive Content Cleanup and Validation ---
  let generatedContent = aiResponseText.trim();
  generatedContent = generatedContent
    .replace(/^```(?:html|text|json)?\n?|```$/g, "")
    .trim();
  generatedContent = generatedContent
    .replace(
      /<!DOCTYPE html>[\s\S]*?<body[^>]*>|(?<=<\/body>)[\s\S]*$|<\/body>|<\/html>|<\/head>|<\/title>|<\/meta>|<\/link>|<\/style>|<style[^>]*>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>/g,
      ""
    )
    .trim();
  generatedContent = generatedContent
    .replace(/<html[^>]*>|<body[^>]*>/g, "")
    .trim();
  generatedContent = generatedContent.replace(/^\s*\n/gm, "").trim();
  generatedContent = generatedContent
    .replace(/^(AI JOURNALIST TONE & STYLE:[\s\S]*?\n\n)?/i, "")
    .trim();
  generatedContent = generatedContent
    .replace(
      /^(Here's the (article|rewritten article|news article|requested article|response)|Article|News Article|Your Article|Generated Article|Title):?\s*\n*/i,
      ""
    )
    .trim();
  if (generatedContent.includes("---START_CONTENT---")) {
    // Remove separator if AI accidentally includes it
    generatedContent =
      generatedContent.split("---START_CONTENT---")[1] || generatedContent;
    console.warn(
      "[AI Generate Content - Func] Stripped unexpected title separator from content."
    );
  }

  // Check for AI's own "insufficient content" flag (case-insensitive and partial match)
  if (
    generatedContent
      .toUpperCase()
      .includes("CONTENT INSUFFICIENT FOR EXPANSION")
  ) {
    throw new Error("AI determined content insufficient for expansion.");
  }

  // --- HTML Post-processing (markdown-it) and Validation ---
  let finalContent = md.render(generatedContent);

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(finalContent);
  const hasMarkdownChars = /[*_`#\[\]]/.test(finalContent);

  if (!hasHtmlTags || hasMarkdownChars) {
    throw new Error(
      `AI output format error: Content is not valid HTML after post-processing or still contains Markdown.`
    );
  }
  if (finalContent.includes("<h1")) {
    throw new Error(
      `AI output format error: Content unexpectedly contains <h1> tags.`
    );
  }

  return finalContent;
}

// POST handler to orchestrate the AI processing pipeline
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  let externalArticle: IExternalNewsArticle | null = null;
  let journalistName = "AI Auto-Generator";

  try {
    const {
      articleId,
      sportCategory,
      journalistId,
    }: { articleId: string; sportCategory?: string; journalistId?: string } =
      await request.json();

    if (!articleId) {
      console.error("[Process Article Orchestrator] Missing Article ID.");
      return NextResponse.json(
        { error: "Article ID is required." },
        { status: 400 }
      );
    }

    externalArticle = await ExternalNewsArticle.findOne({ articleId });

    if (!externalArticle) {
      console.error(
        `[Process Article Orchestrator] External news article not found: ${articleId}`
      );
      return NextResponse.json(
        { error: "External news article not found." },
        { status: 404 }
      );
    }

    if (externalArticle.status === "processed") {
      console.log(
        `[Process Article Orchestrator] Article ${articleId} already processed. Skipping.`
      );
      return NextResponse.json(
        { message: "Article already processed." },
        { status: 200 }
      );
    }
    if (externalArticle.status === "processing") {
      console.warn(
        `[Process Article Orchestrator] Article ${articleId} is already in 'processing' state. Aborting duplicate request.`
      );
      return NextResponse.json(
        { error: "Article is already being processed. Please wait." },
        { status: 409 }
      );
    }

    externalArticle.status = "processing";
    await externalArticle.save();
    console.log(
      `[Process Article Orchestrator] Starting processing for article: ${externalArticle.articleId}, current status updated to 'processing'.`
    );

    // --- Fetch Journalist Name (for author field later) ---
    if (journalistId) {
      const journalist = await AIJournalist.findById(journalistId);
      if (journalist && journalist.isActive) {
        journalistName = journalist.name;
      }
    }

    // 1. Generate Title via dedicated function call
    let newPostTitle: string = "";
    try {
      console.log(
        `[Orchestrator] Calling local generateTitle function for article ${externalArticle.articleId}...`
      );
      newPostTitle = await generateTitle(
        externalArticle.title,
        externalArticle.description || "",
        journalistId
      );
      console.log(
        `[Orchestrator] Successfully generated title: "${newPostTitle}"`
      );
      if (!newPostTitle)
        throw new Error("AI Title Generation returned no title.");
    } catch (titleError: any) {
      console.error(
        `[Orchestrator] Title generation failed for article ${externalArticle.articleId}:`,
        titleError.message
      );
      throw new Error(`Title generation failed: ${titleError.message}`); // Pass original error message
    }

    // 2. Generate Content via dedicated function call
    let rewrittenContent: string = "";
    try {
      console.log(
        `[Orchestrator] Calling local generateContent function for article ${externalArticle.articleId}...`
      );
      rewrittenContent = await generateContent(
        externalArticle.title,
        externalArticle.description || "",
        externalArticle.content,
        externalArticle.link,
        newPostTitle,
        journalistId
      );
      console.log(
        `[Orchestrator] Successfully generated content. Length: ${rewrittenContent.length}`
      );
      if (!rewrittenContent)
        throw new Error("AI Content Generation returned no content.");
    } catch (contentError: any) {
      console.error(
        `[Orchestrator] Content generation failed for article ${externalArticle.articleId}:`,
        contentError.message
      );
      throw new Error(`Content generation failed: ${contentError.message}`); // Pass original error message
    }

    // 3. Process/Generate Featured Image (Existing logic)
    let featuredImageUrl: string | null = null;
    let featuredImageTitle: string | undefined = undefined;
    let featuredImageAltText: string | undefined = undefined;

    // Fallback: Use the original external article's image and proxy it to S3.
    if (externalArticle.imageUrl) {
      try {
        console.log(
          `[Orchestrator] Proxying original image for article ${externalArticle.articleId}...`
        );
        featuredImageUrl = await proxyAndUploadOriginalImage(
          externalArticle.imageUrl,
          newPostTitle
        );
        if (featuredImageUrl) {
          console.log(
            `[Orchestrator] Original image proxied successfully: ${featuredImageUrl}`
          );
        } else {
          console.warn(
            `[Orchestrator] Failed to proxy original image for article ${externalArticle.articleId}. No featured image will be set.`
          );
        }
      } catch (proxyError: any) {
        console.error(
          `[Orchestrator] Error proxying original image for article ${externalArticle.articleId}:`,
          proxyError.message
        );
      }
    } else {
      console.log(
        `[Orchestrator] No image URL found in external article ${externalArticle.articleId}. Skipping image processing.`
      );
    }

    featuredImageTitle = newPostTitle;
    featuredImageAltText = `${newPostTitle} image`;

    // 4. Save the rewritten article as a new Post
    const postSlug = slugify(newPostTitle, { lower: true, strict: true });

    const existingPostWithSlug = await Post.findOne({ slug: postSlug });
    let finalSlug = postSlug;
    if (existingPostWithSlug) {
      finalSlug = `${postSlug}-${Date.now().toString().slice(-5)}`;
      console.warn(
        `[Orchestrator - Post Save] Post with slug '${postSlug}' already exists, new slug: '${finalSlug}'`
      );
    }

    const plainTextContent = rewrittenContent.replace(/<[^>]*>?/gm, "");

    const newPost = new Post({
      title: newPostTitle,
      content: rewrittenContent,
      status: "draft",
      slug: finalSlug,
      author: journalistName,
      featuredImage: featuredImageUrl,
      featuredImageTitle: featuredImageTitle,
      featuredImageAltText: featuredImageAltText,
      sport: sportCategory || externalArticle.category?.[0] || "general",
      metaTitle: `${newPostTitle} - Sports News`,
      metaDescription: plainTextContent.substring(0, 150) + "...",
      isAIGenerated: true,
      originalExternalArticleId: externalArticle._id,
    });

    console.log(
      `[Orchestrator - Post Save] Attempting to save new Post with title: "${
        newPost.title
      }", slug: "${newPost.slug}", image: ${!!newPost.featuredImage}`
    );
    await newPost.save();
    console.log(
      `[Orchestrator - Post Save] Post saved successfully. New Post ID: ${newPost._id}`
    );

    // 5. Final Status Update and Success Response
    externalArticle.status = "processed";
    externalArticle.processedPostId = newPost._id;
    await externalArticle.save();
    console.log(
      `[Orchestrator - Status Update] ExternalNewsArticle ${externalArticle.articleId} status updated to 'processed'.`
    );

    return NextResponse.json(
      {
        message: "Article processed and new post created successfully.",
        postId: newPost._id,
        postSlug: newPost.slug,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // --- Centralized Error Handling and Status Update ---
    let errorMessage = "Server error processing external news.";
    let clientStatus = 500;

    const isCustomError = error instanceof Error;
    let finalArticleStatus: "skipped" | "error" = "error";

    if (isCustomError) {
      errorMessage = error.message; // Use the specific error message thrown by sub-functions
      if (errorMessage.includes("AI determined content insufficient")) {
        clientStatus = 200;
        finalArticleStatus = "skipped";
      } else if (
        errorMessage.includes("AI output format error") ||
        errorMessage.includes("AI-generated title failed strict validation")
      ) {
        clientStatus = 422;
      } else if (errorMessage.includes("AI generation timed out")) {
        clientStatus = 504;
      } else if (errorMessage.includes("Article has no content")) {
        // From fetchAndExtractWebpageContent
        clientStatus = 400;
        finalArticleStatus = "skipped";
      } else if (errorMessage.includes("AI generation failed after")) {
        clientStatus = 500;
      } else if (errorMessage.includes("quota")) {
        errorMessage =
          "Gemini API Quota Exceeded. Please check your usage in Google AI Studio.";
        clientStatus = 429;
      } else if (
        errorMessage.includes("not found") ||
        errorMessage.includes("Network Error") ||
        errorMessage.includes("Failed to fetch content")
      ) {
        // From content extraction or image proxying
        clientStatus = 404;
      } else if (axios.isAxiosError(error) && error.response) {
        // Catch any residual axios errors (should be minimal here)
        errorMessage = `External API error: ${
          error.response.data?.error ||
          error.response?.data?.results?.message ||
          error.message
        }`;
        clientStatus = error.response.status || 500;
      } else if (
        error.message.includes("MongooseError") ||
        error.message.includes("MongoNetworkError")
      ) {
        errorMessage = `Database error: ${error.message}`;
        clientStatus = 500;
      }
    } else {
      errorMessage = `An unexpected error occurred: ${JSON.stringify(error)}`;
    }

    console.error(
      `[Process Article Orchestrator] Critical error processing external news article ${
        externalArticle?.articleId || "unknown"
      }: ${errorMessage}`,
      "\nFull Error Object:",
      error
    );

    if (externalArticle && externalArticle.status === "processing") {
      console.error(
        `[Process Article Orchestrator] Marking external article ${externalArticle.articleId} as '${finalArticleStatus}' due to critical failure.`
      );
      externalArticle.status = finalArticleStatus;
      try {
        await externalArticle.save();
      } catch (dbSaveError) {
        console.error(
          `[Process Article Orchestrator] Failed to save final external article status to '${finalArticleStatus}':`,
          dbSaveError
        );
      }
    } else if (externalArticle && externalArticle.status !== "processed") {
      console.error(
        `[Process Article Orchestrator] Marking external article ${externalArticle.articleId} as 'error' due to unhandled failure (status was ${externalArticle.status}).`
      );
      externalArticle.status = "error";
      try {
        await externalArticle.save();
      } catch (dbSaveError) {
        console.error(
          `[Orchestrator] Failed to save external article status to 'error':`,
          dbSaveError
        );
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: clientStatus });
  }
}
