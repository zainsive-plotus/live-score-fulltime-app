// ===== src/app/api/admin/generate-prediction-news/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import AIJournalist from "@/models/AIJournalist";
import axios from "axios";
import { proxyAndUploadImage } from "@/lib/image-processing-server";
import slugify from "slugify";
import OpenAI from "openai"; // --- Import OpenAI ---

// --- Initialize OpenAI client ---
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

async function getFixtureData(fixtureId: number) {
  const options = (endpoint: string, params: object) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  });

  const fixtureResponse = await axios.request(
    options("fixtures", { id: fixtureId })
  );
  const fixtureData = fixtureResponse.data.response[0];
  if (!fixtureData) {
    throw new Error(`Fixture data not found for ID: ${fixtureId}`);
  }

  const { home, away } = fixtureData.teams;
  const [h2hRes, homeFormRes, awayFormRes] = await Promise.all([
    axios.request(
      options("fixtures/headtohead", { h2h: `${home.id}-${away.id}` })
    ),
    axios.request(options("fixtures", { team: home.id, last: 5 })),
    axios.request(options("fixtures", { team: away.id, last: 5 })),
  ]);

  return {
    ...fixtureData,
    h2h: h2hRes.data.response,
    homeForm: homeFormRes.data.response
      .map((m: any) =>
        m.teams.home.winner ? "W" : m.teams.away.winner ? "L" : "D"
      )
      .join(""),
    awayForm: awayFormRes.data.response
      .map((m: any) =>
        m.teams.away.winner ? "W" : m.teams.home.winner ? "L" : "D"
      )
      .join(""),
  };
}

// --- Rewritten for OpenAI ---
async function generatePredictionTitle(
  homeTeamName: string,
  awayTeamName: string,
  leagueName: string,
  journalistTonePrompt?: string
): Promise<string> {
  const prompt = `
    You are an expert sports journalist. Your ONLY task is to generate a new, original, SEO-friendly title in TURKISH for a news article about the upcoming match: ${homeTeamName} vs ${awayTeamName} in the ${leagueName}.
    
    Your journalistic voice and tone should be: ${journalistTonePrompt || "Objective and informative."}
    
    The new title MUST be highly distinct, capture a fresh angle, and be plain text only with no markdown or quotes.
    
    Generated Title:
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });
  
  const title = response.choices[0]?.message?.content?.trim().replace(/["*]/g, "");
  if (!title) {
    throw new Error("OpenAI failed to generate a prediction title.");
  }
  return title;
}

// --- Rewritten for OpenAI ---
async function generatePredictionContent(
  predictionData: any,
  journalistTonePrompt?: string
): Promise<string> {
  const prompt = `
    You are an expert sports journalist and a charismatic storyteller. Your task is to transform the provided raw match data into a compelling, conversational, and humanized narrative in **PURE HTML** and **TURKISH**. Your writing should be engaging, insightful, and optimized for readability and SEO.

    Your unique journalistic voice and tone should be: ${journalistTonePrompt || "Objective and informative."}

    **CRITICAL INSTRUCTIONS:**
    1.  **HTML ONLY:** Your entire response **MUST** be pure, valid HTML. Use tags like \`<h2>\`, \`<h3>\`, \`<p>\`, \`<strong>\`, \`<em>\`, \`<ul>\`, and \`<li>\`.
    2.  **NO MARKDOWN:** **ABSOLUTELY NO MARKDOWN SYNTAX** like \`#\` or \`*\` is allowed.
    3.  **NO PREAMBLE:** Your response must start directly with an HTML tag (e.g., \`<h2>\`). Do not write "Here is the article...".
    4.  **LANGUAGE & TONE:** The entire article **MUST** be in Turkish. Adopt a conversational, authoritative, and engaging tone.

    **ARTICLE STRUCTURE (Example Flow):**
    1.  **Etkileyici Giriş (Engaging Intro):** Start with a hook.
    2.  **Takımların Form Durumu (Team Form):** Analyze the recent form of both teams.
    3.  **Geçmişin İzleri: H2H Analizi (H2H Analysis):** Discuss past encounters.
    4.  **Maçın Anahtar Oyuncuları (Key Players):** Identify key players.
    5.  **Fanskor'un Gözünden Maçın Kaderi (Fanskor's Prediction):** State the prediction clearly.

    **Provided Match Data (use this to write the article):**
    \`\`\`json
    {
        "league_name": "${predictionData.league.name}",
        "home_team_name": "${predictionData.teams.home.name}",
        "away_team_name": "${predictionData.teams.away.name}",
        "h2h_results_count": ${predictionData.h2h.length},
        "home_form_string": "${predictionData.homeForm}",
        "away_form_string": "${predictionData.awayForm}"
    }
    \`\`\`

    Your Generated HTML Article (Must start with \`<h2>\`):
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content?.trim().replace(/^```(?:html)?\n?|```$/g, "").trim();
  if (!content || !content.includes("<p>")) {
    throw new Error("OpenAI failed to generate valid prediction content.");
  }
  return content;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await dbConnect();

  try {
    const {
      fixtureId,
      journalistId,
      sportsCategory = "football",
    } = await request.json();

    if (!fixtureId || !journalistId) {
      return NextResponse.json(
        { error: "Fixture ID and Journalist ID are required." },
        { status: 400 }
      );
    }

    const existingPost = await Post.findOne({ originalFixtureId: fixtureId });
    if (existingPost) {
      return NextResponse.json(
        {
          message: "Prediction post already exists.",
          postId: existingPost._id,
        },
        { status: 200 }
      );
    }

    const journalist = await AIJournalist.findById(journalistId);
    if (!journalist) {
        throw new Error(`Journalist with ID ${journalistId} not found.`);
    }

    const fixtureData = await getFixtureData(fixtureId);
    const { teams, league } = fixtureData;

    const newPostTitle = await generatePredictionTitle(
      teams.home.name,
      teams.away.name,
      league.name,
      journalist.tonePrompt
    );
    const predictionContent = await generatePredictionContent(
      fixtureData,
      journalist.tonePrompt
    );

    const featuredImageUrl = await proxyAndUploadImage(
      teams.home.logo || teams.away.logo,
      `${teams.home.name}-vs-${teams.away.name}-prediction`
    );

    const postSlug = slugify(newPostTitle, {
      lower: true,
      strict: true,
    });
    const existingSlug = await Post.findOne({ slug: postSlug, language: 'tr' });
    const finalSlug = existingSlug
      ? `${postSlug}-${Date.now().toString().slice(-5)}`
      : postSlug;

    const plainTextContent = predictionContent.replace(/<[^>]*>?/gm, "");

    const newPost = new Post({
      title: newPostTitle,
      content: predictionContent,
      slug: finalSlug,
      status: "draft",
      author: journalist.name,
      isAIGenerated: true,
      sportsCategory: [sportsCategory],
      newsType: "prediction",
      language: 'tr', // Predictions are generated in Turkish first
      linkedFixtureId: fixtureId,
      linkedLeagueId: league.id,
      featuredImage: featuredImageUrl,
      featuredImageTitle: `${teams.home.name} vs ${teams.away.name} Prediction`,
      featuredImageAltText: `${teams.home.name} vs ${teams.away.name} match prediction`,
      metaTitle: `${newPostTitle} | Maç Tahmini`,
      metaDescription: plainTextContent.substring(0, 160) + "...",
      originalFixtureId: fixtureId,
    });

    await newPost.save();

    return NextResponse.json(
      {
        message: "Prediction news generated successfully!",
        postId: newPost._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      `[Generate Prediction] Critical error: ${error.message}`,
      error
    );
    return NextResponse.json(
      { error: "Server error generating prediction news." },
      { status: 500 }
    );
  }
}