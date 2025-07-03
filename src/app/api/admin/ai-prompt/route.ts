// src/app/api/admin/ai-prompt/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import AIPrompt, { IAIPrompt } from "@/models/AIPrompt";

const PROMPT_NAME = "News Rewriting"; // A fixed name for the prompt we will manage

// GET handler to retrieve the AI prompt
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    // Find the prompt by its predefined name
    const promptDoc = await AIPrompt.findOne({ name: PROMPT_NAME });

    if (!promptDoc) {
      // If no prompt exists, return a default one and it will be saved on first PUT
      // This default prompt is critical as it instructs the AI on overall article structure and formatting.
      return NextResponse.json(
        {
          name: PROMPT_NAME,
          prompt:
            "You are an expert sports journalist and content creator with a keen eye for engaging narratives and high humanized accuracy. Your task is to analyze the core information and context from the following sports news content. Based on this, **generate a completely new, original, and expanded article**, approximately 700 words long, suitable for a leading sports news website. Your goal is to make the article feel like it was written by a human expert, not an AI, focusing on deep insights, storytelling, and compelling analysis.\n\n**PRIORITY 1: NEW ORIGINAL TITLE (Single Line)**\nYour **absolute first instruction** is to generate a compelling, highly SEO-friendly, and **BRAND NEW, ORIGINAL TITLE** for this article. This title **MUST be unique** and distinct from the original, but accurately reflect the new article's core topic. The title should be on a single line, and **MUST NOT** include any HTML tags, Markdown formatting (e.g., no bolding, italics, headings like # or ##), or introductory phrases like 'Title: ' or 'New Title: '.\n\n**PRIORITY 2: EXACT SEPARATOR (On its own line)**\nImmediately after the title line, on its own line, you **MUST** place the exact unique separator: `---ARTICLE_CONTENT_STARTS_HERE---`\n\n**PRIORITY 3: HUMANIZED HTML ARTICLE CONTENT**\nThe rest of your response **MUST be the complete humanized article content, written entirely using valid HTML tags.** Avoid any Markdown syntax. Specifically, use `<h2>` for major section headings, `<p>` for paragraphs, `<strong>` for bold text, `<em>` for italic text, `<ul>` and `<li>` for lists, and `<a>` for links. **Ensure the content is well-structured, flows naturally, provides rich detail, and sounds genuinely human-written. Do NOT simply rephrase sentences; genuinely expand and add value.** Include an engaging introduction, several distinct body paragraphs that elaborate on key facts, implications, and broader context, and a strong, forward-looking conclusion. Do NOT use placeholder text for images.\n\n**HTML Example Structure (Strictly follow this style, without preamble or extra text):**\n<h2>Introduction Heading</h2>\n<p>This is the engaging introduction paragraph. It sets the scene for the article content, drawing the reader in with compelling language...</p>\n<h2>Key Development Heading</h2>\n<p>Here's a detailed paragraph on a specific aspect of the news, expanding on the original information with <strong>important facts</strong> and <em>key insights</em>. Consider historical context or future implications. Link to <a href=\"https://example.com/relevant-source\">relevant external sources</a> if appropriate, ensuring the links are valid HTML.</p>\n<ul>\n<li>Detailed point one expanding on the topic.</li>\n<li>Detailed point two with further analysis.</li>\n</ul>\n<p>Another paragraph providing deeper analysis and commentary, making the article feel unique and insightful.</p>\n<h2>Conclusion Heading</h2>\n<p>The concluding paragraph summarizes the article's main points and offers a compelling forward-looking perspective, encouraging discussion or future anticipation.</p>\n\n**IMPORTANT CONSIDERATION:** If the provided original content is too short or lacks sufficient detail for a 700-word expansion with humanized quality, respond only with 'CONTENT INSUFFICIENT FOR EXPANSION: [brief reason]' and no other text. Otherwise, produce the full article following the exact HTML structure and word count.\n\nHere is the original news content (may include raw article text, description, or webpage snippets):\n{article_content}",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(promptDoc, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching AI prompt:", error.message);
    return NextResponse.json(
      { error: "Server error fetching AI prompt." },
      { status: 500 }
    );
  }
}

// PUT handler to update the AI prompt
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { prompt, description }: { prompt: string; description?: string } =
      await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt content is required." },
        { status: 400 }
      );
    }

    // Find and update the prompt, or create it if it doesn't exist
    const updatedPrompt = await AIPrompt.findOneAndUpdate(
      { name: PROMPT_NAME }, // Find by the fixed name
      { prompt, description, name: PROMPT_NAME }, // Ensure name is set for new creation
      { upsert: true, new: true, runValidators: true } // Create if not found, return new doc, run schema validators
    );

    return NextResponse.json(updatedPrompt, { status: 200 });
  } catch (error: any) {
    console.error("Error updating AI prompt:", error.message);
    return NextResponse.json(
      { error: "Server error updating AI prompt." },
      { status: 500 }
    );
  }
}
