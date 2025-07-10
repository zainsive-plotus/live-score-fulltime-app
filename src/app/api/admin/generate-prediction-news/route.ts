// ===== src/app/api/admin/generate-prediction-news/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import AIPrompt from "@/models/AIPrompt";
import AIJournalist from "@/models/AIJournalist";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { proxyAndUploadImage } from "@/lib/image-processing-server"; // Re-importing the original image processor
import slugify from "slugify";

// AI Configuration
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
const TITLE_PROMPT_NAME = "AI Title Generation";
const PREDICTION_PROMPT_NAME = "AI Prediction Content Generation";

// --- Helper function to fetch fixture data from external API ---
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

  // Fetch H2H and Form data for a richer prompt context
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

// --- Helper function to generate a title using AI ---
async function generatePredictionTitle(
  homeTeamName: string,
  awayTeamName: string,
  leagueName: string,
  journalistId?: string
): Promise<string> {
  const titlePromptDoc = await AIPrompt.findOne({
    name: TITLE_PROMPT_NAME,
    type: "title",
  });
  const defaultTitlePrompt =
    "You are an expert sports journalist. Your ONLY task is to generate a new, original, SEO-friendly title in TURKISH for a news article based on the following match. The new title MUST be highly distinct, capture a fresh angle, and be plain text only with no markdown or quotes.\n\nMatch: {home_team} vs {away_team}\nLeague: {league_name}\n\nGenerated Title:";

  let finalTitlePrompt = titlePromptDoc?.prompt || defaultTitlePrompt;
  let journalistTonePrompt = "";
  if (journalistId) {
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistTonePrompt = `As "${journalist.name}", your unique journalistic voice and tone should be: ${journalist.tonePrompt}\n\n`;
    }
  }

  const fullPrompt = `${journalistTonePrompt}${finalTitlePrompt}`
    .replace("{home_team}", homeTeamName)
    .replace("{away_team}", awayTeamName)
    .replace("{league_name}", leagueName);

  const result = await model.generateContent(fullPrompt);
  const responseText = (await result.response).text().trim();
  return responseText.replace(/[\*#"\n]/g, "");
}

// --- ENHANCED Helper function to generate high-quality content ---
async function generatePredictionContent(
  predictionData: any,
  journalistId?: string
): Promise<string> {
  const contentPromptDoc = await AIPrompt.findOne({
    name: PREDICTION_PROMPT_NAME,
    type: "prediction_content",
  });

  const enhancedPrompt = `
You are an expert sports journalist and a charismatic storyteller. Your task is to transform the provided raw match data into a compelling, conversational, and humanized narrative in **PURE HTML** and **TURKISH**. Your writing should be engaging, insightful, and optimized for readability and SEO.

**CRITICAL INSTRUCTIONS:**
1.  **HTML ONLY:** Your entire response **MUST** be pure, valid HTML. Use tags like \`<h2>\`, \`<h3>\`, \`<p>\`, \`<strong>\`, \`<em>\`, \`<ul>\`, and \`<li>\`.
2.  **NO MARKDOWN:** **ABSOLUTELY NO MARKDOWN SYNTAX** like \`#\` or \`*\` is allowed.
3.  **NO PREAMBLE:** Your response must start directly with an HTML tag (e.g., \`<h2>\`). Do not write "Here is the article...".
4.  **LANGUAGE & TONE:** The entire article **MUST** be in Turkish. Adopt a conversational, authoritative, and engaging tone. Ask rhetorical questions to the reader. Use vivid language and analogies to make statistics interesting.

**CONTENT & SEO GUIDELINES:**
*   **Narrative Flow:** Don't just list data. Weave the stats, H2H, and form into a story about the upcoming match. Create a compelling argument for why the match is important.
*   **Heading Hierarchy:** Use descriptive \`<h2>\` and \`<h3>\` tags that naturally include keywords (e.g., "Takımların Son Form Durumu," "Kritik Mücadele Alanları," "Maçın Anahtar Oyuncuları"). **Do not use \`<h1>\`**.
*   **Keyword Integration:** Naturally use the team names, league name, and related terms like "maç tahmini," "analiz," "kadrolar," and "puan durumu" throughout the text.
*   **Provide Value:** Your analysis should give the reader a deeper understanding of what to expect, beyond just the raw numbers.

**ARTICLE STRUCTURE (Example Flow):**
1.  **Etkileyici Giriş (Engaging Intro):** Start with a hook. Example: "<h2>Futbolseverler Nefeslerini Tuttu: {league_name} Sahnesinde Dev Randevu!</h2><p>Bu hafta sonu {league_name} sahnesi, {home_team_name} ile {away_team_name} arasında nefes kesecek bir mücadeleye ev sahipliği yapıyor. Peki bu kritik 90 dakikada bizleri neler bekliyor? Gelin, hep birlikte bu dev maçın şifrelerini çözelim.</p>"
2.  **Takımların Form Durumu (Team Form):** Analyze the recent form of both teams. Discuss their recent wins, losses, and what this momentum means.
3.  **Geçmişin İzleri: H2H Analizi (H2H Analysis):** Discuss past encounters. Who has the historical upper hand?
4.  **Puan Durumundaki Yansımalar (Standings Impact):** Explain the stakes. What does a win, loss, or draw mean for each team's position in the league?
5.  **Maçın Anahtar Oyuncuları (Key Players):** Identify one key player from each team who could decide the fate of the match and explain why.
6.  **Fanskor'un Gözünden Maçın Kaderi (Fanskor's Prediction):** State the prediction clearly and justify it conversationally based on the analysis above.
7.  **Sonuç ve Beklentiler (Conclusion):** Summarize and look ahead. End with a question to engage the reader.

**Provided Match Data (use this to write the article):**
\`\`\`json
{match_data}
\`\`\`

**Your Generated HTML Article (Must start with \`<h2>\`):**
`;

  let finalContentPrompt = contentPromptDoc?.prompt || enhancedPrompt;
  const { league, teams, h2h, homeForm, awayForm } = predictionData;
  const dataForPrompt = {
    league_name: league.name,
    home_team_name: teams.home.name,
    away_team_name: teams.away.name,
    h2h_results: h2h.slice(0, 3),
    home_form: homeForm,
    away_form: awayForm,
  };

  finalContentPrompt = finalContentPrompt.replace(
    "{match_data}",
    JSON.stringify(dataForPrompt, null, 2)
  );

  let journalistTonePrompt = "";
  if (journalistId) {
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistTonePrompt = `As "${journalist.name}", your unique journalistic voice and tone should be: ${journalist.tonePrompt}\n\n`;
    }
  }

  const fullPrompt = `${journalistTonePrompt}${finalContentPrompt}`;
  const result = await model.generateContent(fullPrompt);
  const aiResponseText = (await result.response).text();

  return aiResponseText
    .trim()
    .replace(/^```(?:html)?\n?|```$/g, "")
    .trim();
}

// --- Main POST handler ---
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

    const fixtureData = await getFixtureData(fixtureId);
    const { teams, league } = fixtureData;

    const newPostTitle = await generatePredictionTitle(
      teams.home.name,
      teams.away.name,
      league.name,
      journalistId
    );
    const predictionContent = await generatePredictionContent(
      fixtureData,
      journalistId
    );

    const featuredImageUrl = await proxyAndUploadImage(
      teams.home.logo || teams.away.logo,
      `${teams.home.name}-vs-${teams.away.name}-prediction`
    );

    const postSlug = slugify(newPostTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const existingSlug = await Post.findOne({ slug: postSlug });
    const finalSlug = existingSlug
      ? `${postSlug}-${Date.now().toString().slice(-5)}`
      : postSlug;

    const plainTextContent = predictionContent.replace(/<[^>]*>?/gm, "");

    const newPost = new Post({
      title: newPostTitle,
      content: predictionContent,
      slug: finalSlug,
      status: "draft",
      author:
        (await AIJournalist.findById(journalistId))?.name ||
        "AI Auto-Generator",
      isAIGenerated: true,
      sportsCategory: [sportsCategory],
      newsType: "prediction",
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
