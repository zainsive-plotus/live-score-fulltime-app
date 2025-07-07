// src/app/api/admin/process-external-news/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle, {
  IExternalNewsArticle,
} from "@/models/ExternalNewsArticle";
import Post, { PostCategory } from "@/models/Post";
import AIPrompt from "@/models/AIPrompt";
import AIJournalist from "@/models/AIJournalist";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import slugify from "slugify";
import path from "path";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY as string,
  },
});
const R2_BUCKET_NAME = process.env.NEXT_PUBLIC_R2_BUCKET_NAME as string;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_BUCKET_URL as string;
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

async function proxyAndUploadOriginalImage(
  imageUrl: string,
  newPostTitle: string
): Promise<string | null> {
  try {
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const inputBuffer = Buffer.from(imageResponse.data, "binary");
    const originalContentType =
      imageResponse.headers["content-type"] || "image/jpeg";
    let finalBuffer: Buffer;
    let finalContentType: string = originalContentType;
    let fileExtension: string;
    if (originalContentType.includes("image/gif")) {
      finalBuffer = inputBuffer;
      finalContentType = "image/gif";
      fileExtension = ".gif";
    } else {
      try {
        finalBuffer = await sharp(inputBuffer)
          .resize(1200, 630, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        finalContentType = "image/webp";
        fileExtension = ".webp";
      } catch (sharpError: any) {
        finalBuffer = inputBuffer;
        finalContentType = originalContentType;
        fileExtension = path.extname(new URL(imageUrl).pathname) || ".jpg";
      }
    }
    const slug = slugify(newPostTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const uniqueSuffix = Date.now().toString().slice(-6);
    const newFileName = `fanskor-${slug}-${uniqueSuffix}${fileExtension}`;
    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: newFileName,
      Body: finalBuffer,
      ContentType: finalContentType,
    });
    await s3Client.send(putObjectCommand);
    return `${R2_PUBLIC_URL}/${newFileName}`;
  } catch (imageError: any) {
    console.error(
      `[Image Processing] Failed to process/upload original image (URL: ${imageUrl}):`,
      imageError.message
    );
    return null;
  }
}
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const TITLE_PROMPT_NAME = "AI Title Generation";
const CONTENT_PROMPT_NAME = "AI Content Generation";
interface IAIPrompt {
  _id: string;
  name: string;
  prompt: string;
  description?: string;
  type: "title" | "content" | "prediction_content";
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(Boolean));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(Boolean));
  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;
  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}
async function fetchAndExtractWebpageContent(
  url: string
): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    if (response.status !== 200) {
      return null;
    }
    const cheerio = require("cheerio");
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
        if (extractedText.length > 200) break;
      }
    }
    extractedText = extractedText.replace(/\s\s+/g, " ").trim();
    return extractedText.length > 0 ? extractedText : null;
  } catch (error: any) {
    console.error(
      `[Content Extraction Helper] Error fetching or extracting content from ${url}:`,
      error.message
    );
    return null;
  }
}
async function generateTitle(
  originalTitle: string,
  originalDescription: string,
  journalistId?: string
): Promise<string> {
  const titlePromptDoc = await AIPrompt.findOne({
    name: TITLE_PROMPT_NAME,
    type: "title",
  });
  const defaultTitlePrompt =
    "YOUR ONLY TASK IS TO GENERATE A NEWS ARTICLE TITLE IN TURKISH. Output MUST be plain text only, on a single line. NO HTML, NO Markdown. NO preambles. NO prefixes like 'Title: '.\\n\\nYou are an expert sports journalist. Generate a **new, original, SEO-friendly title in TURKISH** for a news article based on the following original title and description. The new title MUST be highly distinct from the original, capture a fresh angle, and avoid simply rephrasing original keywords.\\n\\nOriginal Title: {original_title}\\nOriginal Description: {original_description}\\n\\nGenerated Title:";
  let finalTitlePrompt = titlePromptDoc?.prompt || defaultTitlePrompt;
  let journalistTonePrompt = "";
  if (journalistId) {
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistTonePrompt = `As "${journalist.name}", your unique journalistic voice and tone should be: ${journalist.tonePrompt}\n\n`;
    }
  }
  const fullPrompt = `${journalistTonePrompt}${finalTitlePrompt}`
    .replace("{original_title}", originalTitle)
    .replace("{original_description}", originalDescription);
  let aiResponseText: string = "";
  for (let i = 0; i < 3; i++) {
    try {
      const result: any = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("AI title generation timed out.")),
            20000
          )
        ),
      ]);
      aiResponseText = (await result.response).text();
      break;
    } catch (aiError: any) {
      if (
        i < 2 &&
        (aiError.message.includes("timed out.") ||
          aiError.status === 429 ||
          (aiError.status >= 500 && aiError.status < 600))
      ) {
        await new Promise((res) => setTimeout(res, 2000));
      } else {
        throw new Error(
          `AI title generation failed after 3 retries: ${aiError.message}`
        );
      }
    }
  }
  if (!aiResponseText) {
    throw new Error("AI title generation failed to produce a response.");
  }
  let generatedTitle = aiResponseText
    .trim()
    .replace(/^```(?:html|text|json)?\n?|```$/g, "")
    .trim()
    .replace(
      /<!DOCTYPE html>[\s\S]*?<body[^>]*>|(?<=<\/body>)[\s\S]*$|<\/body>|<\/html>|<\/head>|<\/title>|<\/meta>|<\/link>|<\/style>|<style[^>]*>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>/g,
      ""
    )
    .trim()
    .replace(/<html[^>]*>|<body[^>]*>/g, "")
    .trim()
    .replace(/^\s*\n/gm, "")
    .trim()
    .replace(/^(AI JOURNALIST TONE & STYLE:[\s\S]*?\n\n)?/i, "")
    .trim()
    .replace(
      /^(Here's the (title|article|rewritten title|news article|requested article|response)|Article Title|Generated Title|Title):?\s*\n*/i,
      ""
    )
    .trim()
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\*_`#\[\]\n]/g, "")
    .trim();
  const originalTitleLower = originalTitle.toLowerCase();
  const generatedTitleLower = generatedTitle.toLowerCase();
  const jaccardSimilarity = calculateJaccardSimilarity(
    originalTitleLower,
    generatedTitleLower
  );
  if (
    generatedTitle.length < 10 ||
    jaccardSimilarity > 0.4 ||
    generatedTitleLower === originalTitleLower
  ) {
    throw new Error(
      `Generated title failed strict validation (too short, not unique, or too similar).`
    );
  }
  return generatedTitle;
}
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
  const defaultContentPrompt =
    "Your ONLY task is to generate a news article content in TURKISH HTML. NO Markdown, NO preambles, NO extra text, NO code block wrappers (```html). DO NOT INCLUDE `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`, `<h1>`, or any other full document tags. \\n\\nYou are an expert sports journalist. Analyze the following news title, description, and provided context. Your goal is to generate a comprehensive, human-like, SEO-optimized HTML article, approximately 700 words long. Focus on deep insights, storytelling, and compelling analysis.\\n\\n**GUIDELINES:**\\n1.  **HTML CONTENT:** Provide valid HTML. Use `<h2>` for main headings (optimized for keywords), `<p>` for paragraphs, `<strong>`, `<em>`, `<ul>`, `<li>`, `<a>`. Ensure natural flow, rich detail, and human tone. Integrate relevant keywords naturally throughout the article for SEO, but avoid stuffing.\\n\\n**HTML Example Structure:**\\n<h2>Giriş Başlığı</h2><p>Bu, makale içeriğinin zeminini hazırlayan etkileyici giriş paragrafıdır...</p>\\n<h2>Ana Gelişmeler</h2><p>İşte belirli bir yönüyle ilgili detaylı bir paragraf...</p><ul><li>...</li></ul><p>...</p><h2>Sonuç</h2><p>Sonuç paragrafı, makalenin ana noktalarını özetler ve ileriye dönük etkileyici bir bakış açısı sunar.</p>\\n\\n**ÖNEMLİ:** Sağlanan içerik 700 kelimelik SEO optimize edilmiş bir genişletme için çok kısaysa veya yeterli ayrıntıdan yoksunsa, SADECE 'GENİŞLETME İÇİN İÇERİK YETERSİZ: [kısa neden]' yanıtını verin. Başka hiçbir metin kullanmayın.\\n\\nGenerated Article Title: {generated_title}\\nOriginal News Title: {original_title}\\nOriginal News Description: {original_description}\\nAdditional Context: {additional_context}";
  let finalContentPrompt = contentPromptDoc?.prompt || defaultContentPrompt;
  let journalistTonePrompt = "";
  if (journalistId) {
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistTonePrompt = `As "${journalist.name}", your unique journalistic voice and tone should be: ${journalist.tonePrompt}\n\n`;
    }
  }
  let combinedArticleContext = "";
  if (originalTitle) combinedArticleContext += `Title: ${originalTitle}\\n`;
  if (originalDescription)
    combinedArticleContext += `Description: ${originalDescription}\\n`;
  if (originalContent && originalContent.length > 50) {
    combinedArticleContext += `\\nFull Content: ${originalContent}\\n`;
  }
  if (articleLink && combinedArticleContext.length < 100) {
    const fetchedWebContent = await fetchAndExtractWebpageContent(articleLink);
    if (fetchedWebContent && fetchedWebContent.length > 50) {
      combinedArticleContext += `\\nWebpage Context: ${fetchedWebContent}\\n`;
    }
  }
  if (!combinedArticleContext || combinedArticleContext.length < 100) {
    throw new Error(
      "Article content (title, description, or external content) too short or missing to generate content."
    );
  }
  if (combinedArticleContext.length > 8000) {
    combinedArticleContext =
      combinedArticleContext.substring(0, 8000) +
      "... (truncated for AI processing)";
  }
  const fullPrompt = `${journalistTonePrompt}${finalContentPrompt}`
    .replace("{generated_title}", generatedTitle)
    .replace("{original_title}", originalTitle)
    .replace("{original_description}", originalDescription)
    .replace("{additional_context}", combinedArticleContext);
  let aiResponseText: string = "";
  for (let i = 0; i < 3; i++) {
    try {
      const result: any = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("AI content generation timed out.")),
            90000
          )
        ),
      ]);
      aiResponseText = (await result.response).text();
      break;
    } catch (aiError: any) {
      if (
        i < 2 &&
        (aiError.message.includes("timed out.") ||
          aiError.status === 429 ||
          (aiError.status >= 500 && aiError.status < 600))
      ) {
        await new Promise((res) => setTimeout(res, 3000));
      } else {
        throw new Error(
          `AI content generation failed after 3 retries: ${aiError.message}`
        );
      }
    }
  }
  if (!aiResponseText) {
    throw new Error("AI content generation failed to produce a response.");
  }
  let generatedContent = aiResponseText
    .trim()
    .replace(/^```(?:html|text|json)?\n?|```$/g, "")
    .trim()
    .replace(
      /<!DOCTYPE html>[\s\S]*?<body[^>]*>|(?<=<\/body>)[\s\S]*$|<\/body>|<\/html>|<\/head>|<\/title>|<\/meta>|<\/link>|<\/style>|<style[^>]*>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>/g,
      ""
    )
    .trim()
    .replace(/<html[^>]*>|<body[^>]*>/g, "")
    .trim()
    .replace(/^\s*\n/gm, "")
    .trim()
    .replace(/^(AI JOURNALIST TONE & STYLE:[\s\S]*?\n\n)?/i, "")
    .trim()
    .replace(
      /^(Here's the (article|rewritten article|news article|requested article|response)|Article|News Article|Your Article|Generated Article|Title):?\s*\n*/i,
      ""
    )
    .trim();
  if (generatedContent.includes("---START_CONTENT---")) {
    generatedContent =
      generatedContent.split("---START_CONTENT---")[1] || generatedContent;
  }
  if (
    generatedContent
      .toUpperCase()
      .includes("CONTENT INSUFFICIENT FOR EXPANSION")
  ) {
    throw new Error("AI determined content insufficient for expansion.");
  }
  const MarkdownIt = require("markdown-it");
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
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
      sportCategory, // This is the single category passed from the UI
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
      return NextResponse.json(
        { error: "External news article not found." },
        { status: 404 }
      );
    }
    if (externalArticle.status === "processed") {
      return NextResponse.json(
        { message: "Article already processed." },
        { status: 200 }
      );
    }
    if (externalArticle.status === "processing") {
      return NextResponse.json(
        { error: "Article is already being processed. Please wait." },
        { status: 409 }
      );
    }

    externalArticle.status = "processing";
    await externalArticle.save();

    if (journalistId) {
      const journalist = await AIJournalist.findById(journalistId);
      if (journalist && journalist.isActive) {
        journalistName = journalist.name;
      }
    }

    const newPostTitle = await generateTitle(
      externalArticle.title,
      externalArticle.description || "",
      journalistId
    );
    const rewrittenContent = await generateContent(
      externalArticle.title,
      externalArticle.description || "",
      externalArticle.content,
      externalArticle.link,
      newPostTitle,
      journalistId
    );

    let featuredImageUrl: string | null = null;
    if (externalArticle.imageUrl) {
      featuredImageUrl = await proxyAndUploadOriginalImage(
        externalArticle.imageUrl,
        newPostTitle
      );
    }
    const featuredImageTitle = newPostTitle;
    const featuredImageAltText = `${newPostTitle} image`;

    const postSlug = slugify(newPostTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const existingPostWithSlug = await Post.findOne({ slug: postSlug });
    let finalSlug = postSlug;
    if (existingPostWithSlug) {
      finalSlug = `${postSlug}-${Date.now().toString().slice(-5)}`;
    }

    const plainTextContent = rewrittenContent.replace(/<[^>]*>?/gm, "");

    // --- MODIFIED: Create categories array ---
    // Start with the category passed from the UI (e.g., 'football').
    // Then, add the category from the external source if it exists and is valid.
    const categories: PostCategory[] = [];
    if (
      sportCategory &&
      ["football", "basketball", "tennis", "general"].includes(sportCategory)
    ) {
      categories.push(sportCategory as PostCategory);
    }

    const sourceCategory = externalArticle.category?.[0];
    if (
      sourceCategory &&
      ["football", "basketball", "tennis", "general"].includes(
        sourceCategory
      ) &&
      !categories.includes(sourceCategory as PostCategory)
    ) {
      categories.push(sourceCategory as PostCategory);
    }

    // If no valid category was found, default to 'general'.
    if (categories.length === 0) {
      categories.push("general");
    }

    const newPost = new Post({
      title: newPostTitle,
      content: rewrittenContent,
      status: "draft",
      slug: finalSlug,
      author: journalistName,
      featuredImage: featuredImageUrl,
      featuredImageTitle: featuredImageTitle,
      featuredImageAltText: featuredImageAltText,
      // --- MODIFIED: Assign the new categories array ---
      sport: categories,
      metaTitle: `${newPostTitle} - Sports News`,
      metaDescription: plainTextContent.substring(0, 150) + "...",
      isAIGenerated: true,
      originalExternalArticleId: externalArticle._id,
    });

    await newPost.save();

    externalArticle.status = "processed";
    externalArticle.processedPostId = newPost._id;
    await externalArticle.save();

    return NextResponse.json(
      {
        message: "Article processed and new post created successfully.",
        postId: newPost._id,
        postSlug: newPost.slug,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // --- Centralized Error Handling (Unchanged) ---
    let errorMessage = "Server error processing external news.";
    let clientStatus = 500;
    let finalArticleStatus: "skipped" | "error" = "error";

    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes("AI determined content insufficient")) {
        clientStatus = 200;
        finalArticleStatus = "skipped";
      } else if (
        errorMessage.includes("AI output format error") ||
        errorMessage.includes("AI-generated title failed strict validation") ||
        errorMessage.includes("Content generation failed") ||
        errorMessage.includes("Title generation failed")
      ) {
        clientStatus = 422;
      } else if (errorMessage.includes("AI generation timed out")) {
        clientStatus = 504;
      } else if (
        errorMessage.includes("Article has no content") ||
        errorMessage.includes("content too short")
      ) {
        clientStatus = 400;
        finalArticleStatus = "skipped";
      } else if (errorMessage.includes("AI generation failed after")) {
        clientStatus = 500;
      } else if (errorMessage.includes("quota")) {
        errorMessage =
          "Gemini API Quota Exceeded. Please check your usage in Google AI Studio.";
        clientStatus = 429;
      } else if (axios.isAxiosError(error) && error.response) {
        errorMessage = `External API error: ${
          error.response.data?.error ||
          error.response?.data?.results?.message ||
          error.message
        }`;
        clientStatus = error.response.status || 500;
      }
    }

    if (externalArticle && externalArticle.status === "processing") {
      externalArticle.status = finalArticleStatus;
      await externalArticle.save();
    }

    return NextResponse.json({ error: errorMessage }, { status: clientStatus });
  }
}
