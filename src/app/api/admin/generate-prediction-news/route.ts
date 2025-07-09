// src/app/api/admin/generate-prediction-news/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import AIPrompt from "@/models/AIPrompt";
import AIJournalist from "@/models/AIJournalist";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import slugify from "slugify";
// import { generateSimplePrediction } from "@/lib/prediction-engine";
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

async function uploadImageToR2(
  imageUrl: string,
  fileNamePrefix: string
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
    const slug = slugify(fileNamePrefix, {
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
      `[Image Upload] Failed to upload image (URL: ${imageUrl}):`,
      imageError.message
    );
    return null;
  }
}
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
const TITLE_PROMPT_NAME = "AI Title Generation";
const PREDICTION_PROMPT_NAME = "AI Prediction Content Generation";
interface IAIPrompt {
  _id: string;
  name: string;
  prompt: string;
  description?: string;
  type: "title" | "content" | "prediction_content";
}

async function generatePredictionTitle(
  homeTeamName: string,
  awayTeamName: string,
  leagueName: string,
  predictedOutcome: string,
  journalistId?: string
): Promise<string> {
  const titlePromptDoc = await AIPrompt.findOne({
    name: TITLE_PROMPT_NAME,
    type: "title",
  });
  const defaultTitlePrompt =
    "YOUR ONLY TASK IS TO GENERATE A NEWS ARTICLE TITLE IN TURKISH. Output MUST be plain text only, on a single line. NO HTML, NO Markdown. NO preambles. NO prefixes like 'Title: '.\\n\\nYou are an expert sports journalist. Generate a **new, original, SEO-friendly title in TURKISH** for a news article based on the following original title and description. The new title MUST be highly distinct from the original, capture a fresh angle, and avoid simply rephrasing original keywords.\\n\\nMatch: {home_team} vs {away_team}\\nLeague: {league_name}\\nPredicted Outcome: {predicted_outcome}\\n\\nGenerated Title:";
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
    .replace("{league_name}", leagueName)
    .replace("{predicted_outcome}", predictedOutcome);
  let aiResponseText: string = "";
  for (let i = 0; i < 3; i++) {
    try {
      const result: any = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("AI prediction title generation timed out.")),
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
          `AI prediction title generation failed after 3 retries: ${aiError.message}`
        );
      }
    }
  }
  if (!aiResponseText) {
    throw new Error(
      "AI prediction title generation failed to produce a response."
    );
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
  if (generatedTitle.length < 10) {
    throw new Error(
      `Generated prediction title failed strict validation (too short).`
    );
  }
  return generatedTitle;
}

async function generatePredictionContent(
  predictionData: any,
  journalistId?: string
): Promise<string> {
  const contentPromptDoc = await AIPrompt.findOne({
    name: PREDICTION_PROMPT_NAME,
    type: "prediction_content",
  });
  if (!contentPromptDoc) {
    console.warn(
      `[AI Generate Content - Func] Prediction prompt "${PREDICTION_PROMPT_NAME}" (type 'prediction_content') not found. Using default internal prompt.`
    );
  }
  const defaultPredictionPrompt = `
You are an expert sports journalist and a charismatic storyteller. Your task is to transform the provided raw match data into a compelling, conversational, and humanized narrative in **PURE HTML** and **TURKISH**. Your writing should be engaging, insightful, and optimized for readability and SEO.

**CRITICAL INSTRUCTIONS:**
1.  **HTML ONLY:** Your entire response **MUST** be pure, valid HTML. Use tags like \`<h2>\`, \`<p>\`, \`<strong>\`, \`<em>\`, \`<ul>\`, and \`<li>\`.
2.  **NO MARKDOWN:** **ABSOLUTELY NO MARKDOWN SYNTAX** is allowed.
3.  **NO PREAMBLE:** Your response must start directly with an HTML tag (e.g., \`<h2>\`).
4.  **LANGUAGE & TONE:** The entire article **MUST** be in Turkish. Adopt a conversational, authoritative, and engaging tone. Ask rhetorical questions to the reader. Use vivid language and analogies to make statistics interesting.

**CONTENT & SEO GUIDELINES:**
*   **Narrative Flow:** Don't just list data. Weave the stats, H2H, and form into a story about the upcoming match.
*   **Subheadings:** Use descriptive \`<h2>\` tags that naturally include keywords (e.g., "Takımların Son Form Durumu," "Kritik Mücadele Alanları").
*   **Keyword Integration:** Naturally use the team names, league name, and related terms like "maç tahmini," "analiz," "kadrolar," and "puan durumu" throughout the text.
*   **Provide Value:** Your analysis should give the reader a deeper understanding of what to expect, beyond just the numbers.

**ARTICLE STRUCTURE (Example Flow):**
1.  **Etkileyici Giriş (Engaging Intro):** Start with a hook. "Futbolseverler nefeslerini tuttu, çünkü {league_name} sahnesinde {home_team_name} ile {away_team_name} arasında nefes kesecek bir mücadele bizleri bekliyor. Peki bu kritik 90 dakikada bizleri neler bekliyor? Gelin, hep birlikte bu dev maçın şifrelerini çözelim."
2.  **Takımların Form Durumu (Team Form):** Analyze the recent form (e.g., "WWDLW"). "Ev sahibi {home_team_name}, son haftalarda {home_form_string} gibi bir form grafiği çizerek rakiplerine gözdağı verdi. Peki bu seri, zorlu rakipleri karşısında devam edebilecek mi?"
3.  **Geçmişin İzleri: H2H Analizi (H2H Analysis):** Discuss past encounters. "İki ekip arasındaki rekabette geçmiş ne söylüyor? Son beş maçlık seriye baktığımızda, dengelerin ne kadar hassas olduğunu görebiliyoruz."
4.  **Puan Durumundaki Yansımalar (Standings Impact):** Explain the stakes. "Bu maç sadece bir galibiyetten çok daha fazlası anlamına geliyor. {home_team_name} için zirve yarışında kalma, {away_team_name} için ise Avrupa potasından kopmama mücadelesi..."
5.  **Fanskor'un Gözünden Maçın Kaderi (Fanskor's Prediction):** State the prediction clearly and justify it conversationally. "Tüm bu verileri bir araya getirdiğimizde, Fanskor'un tescilli analiz motoru ibreyi {predicted_outcome} tarafına çeviriyor. %{confidence} oranındaki bu tahminimizin arkasında, özellikle ev sahibinin form grafiği ve rakibine karşı kurduğu psikolojik üstünlük yatıyor."
6.  **Sonuç ve Beklentiler (Conclusion):** Summarize and look ahead. "Sonuç olarak, taktiksel bir satranç mücadelesi ve bol gollü bir karşılaşma bizleri bekliyor olabilir. Sizce maçın yıldızı kim olacak? Yorumlarınızı bekliyoruz!"

**Provided Match Data:**
\`\`\`json
{match_data}
\`\`\`

**Prediction Article Content (Must start with an HTML tag):**
`;
  let finalContentPrompt = contentPromptDoc?.prompt || defaultPredictionPrompt;
  finalContentPrompt = finalContentPrompt.replace(
    "{match_data}",
    JSON.stringify(predictionData, null, 2)
  );
  let journalistTonePrompt = "";
  if (journalistId) {
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistTonePrompt = `As "${journalist.name}", your unique journalistic voice and tone should be: ${journalist.tonePrompt}\n\n`;
    }
  }
  const fullPrompt = `${journalistTonePrompt}${finalContentPrompt}`;
  let aiResponseText: string = "";
  for (let i = 0; i < 3; i++) {
    try {
      const result: any = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("AI prediction content generation timed out.")),
            120000
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
          `AI prediction content generation failed after 3 retries: ${aiError.message}`
        );
      }
    }
  }
  if (!aiResponseText) {
    throw new Error(
      "AI prediction content generation failed to produce a response."
    );
  }
  let generatedContent = aiResponseText
    .trim()
    .replace(/^```(?:html|text|json)?\n?|```$/g, "")
    .trim()
    .replace(/^(AI JOURNALIST TONE & STYLE:[\s\S]*?\n\n)?/i, "")
    .trim()
    .replace(
      /^(Here's the (article|HTML content|response)|Article):?\s*\n*/i,
      ""
    )
    .trim();
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(generatedContent);
  const hasMarkdownChars = /[*_`#\[\]]/.test(generatedContent);
  if (!hasHtmlTags || hasMarkdownChars) {
    throw new Error(
      `AI output format error: Content is not valid HTML or still contains Markdown.`
    );
  }
  let finalContent = generatedContent;
  if (finalContent.includes("<h1")) {
    throw new Error(
      `AI output format error: Content unexpectedly contains <h1> tags.`
    );
  }
  return finalContent;
}

// --- POST handler to orchestrate the AI prediction news generation pipeline ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await dbConnect();
  let fixtureId: number | null = null;
  let journalistName = "AI Auto-Generator";
  try {
    const {
      fixtureId: inputFixtureId,
      journalistId,
      sportCategory,
    }: {
      fixtureId: number;
      journalistId: string;
      sportCategory?: string;
    } = await request.json();
    fixtureId = inputFixtureId;
    if (!fixtureId || !journalistId) {
      return NextResponse.json(
        { error: "Fixture ID and Journalist ID are required." },
        { status: 400 }
      );
    }
    const existingPost = await Post.findOne({
      originalFixtureId: fixtureId,
      sport: "prediction",
    });
    if (existingPost) {
      return NextResponse.json(
        {
          message: "Prediction post already exists for this fixture.",
          postId: existingPost._id,
        },
        { status: 200 }
      );
    }
    const options = (endpoint: string, params: object) => ({
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    });
    const [fixtureRes, h2hRes, standingsRes, homeFormRes, awayFormRes] =
      await Promise.all([
        axios.request(options("fixtures", { id: fixtureId })),
        axios.request(
          options("fixtures/headtohead", {
            h2h: `${
              (
                await axios.request(options("fixtures", { id: fixtureId }))
              ).data.response[0].teams.home.id
            }-${
              (
                await axios.request(options("fixtures", { id: fixtureId }))
              ).data.response[0].teams.away.id
            }`,
          })
        ),
        axios.request(
          options("standings", {
            league: (
              await axios.request(options("fixtures", { id: fixtureId }))
            ).data.response[0].league.id,
            season: (
              await axios.request(options("fixtures", { id: fixtureId }))
            ).data.response[0].league.season,
          })
        ),
        axios.request(
          options("fixtures", {
            team: (
              await axios.request(options("fixtures", { id: fixtureId }))
            ).data.response[0].teams.home.id,
            last: 5,
            season: (
              await axios.request(options("fixtures", { id: fixtureId }))
            ).data.response[0].league.season,
          })
        ),
        axios.request(
          options("fixtures", {
            team: (
              await axios.request(options("fixtures", { id: fixtureId }))
            ).data.response[0].teams.away.id,
            last: 5,
            season: (
              await axios.request(options("fixtures", { id: fixtureId }))
            ).data.response[0].league.season,
          })
        ),
      ]);
    const fixtureData = fixtureRes.data.response[0];
    if (!fixtureData) {
      throw new Error(`Fixture data not found for ID: ${fixtureId}`);
    }
    const { home: homeTeam, away: awayTeam } = fixtureData.teams;
    const league = fixtureData.league;
    // const predictionResult = generateSimplePrediction({
    //   fixture: fixtureData,
    //   h2h: h2hRes.data.response || [],
    //   standings: standingsRes.data.response || [],
    //   homeTeamForm: homeFormRes.data.response || [],
    //   awayTeamForm: awayFormRes.data.response || [],
    // });
    const fullPredictionDataForAI = {
      fixture: fixtureData,
      h2h: h2hRes.data.response,
      standings: standingsRes.data.response,
      homeTeamForm: homeFormRes.data.response,
      awayTeamForm: awayFormRes.data.response,
      // fanskorPrediction: predictionResult,
    };
    const journalist = await AIJournalist.findById(journalistId);
    if (journalist && journalist.isActive) {
      journalistName = journalist.name;
    }
    const newPostTitle = await generatePredictionTitle(
      homeTeam.name,
      awayTeam.name,
      league.name,
      // predictionResult.text,
      journalistId
    );
    const predictionContent = await generatePredictionContent(
      fullPredictionDataForAI,
      journalistId
    );
    let featuredImageUrl: string | null = null;
    let featuredImageTitle: string | undefined = undefined;
    let featuredImageAltText: string | undefined = undefined;
    const teamLogoUrls = [homeTeam.logo, awayTeam.logo].filter(Boolean);
    if (teamLogoUrls.length > 0) {
      featuredImageUrl = await uploadImageToR2(
        homeTeam.logo || awayTeam.logo,
        `${homeTeam.name}-vs-${awayTeam.name}-prediction`
      );
    }
    featuredImageTitle = `${homeTeam.name} vs ${awayTeam.name} Maç Tahmini`;
    featuredImageAltText = `${homeTeam.name} ve ${awayTeam.name} arasındaki maç tahmini kapak görseli`;
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
    const plainTextContent = predictionContent.replace(/<[^>]*>?/gm, "");
    const newPost = new Post({
      title: newPostTitle,
      content: predictionContent,
      status: "draft",
      slug: finalSlug,
      author: journalistName,
      featuredImage: featuredImageUrl,
      featuredImageTitle: featuredImageTitle,
      featuredImageAltText: featuredImageAltText,
      // --- MODIFIED: Assign multiple categories ---
      sport: ["prediction", sportCategory || "football"] as any[],
      metaTitle: `${newPostTitle} | Maç Tahmini`,
      metaDescription: plainTextContent.substring(0, 150) + "...",
      isAIGenerated: true,
      originalFixtureId: fixtureId,
    });

    await newPost.save();
    return NextResponse.json(
      {
        message: "Prediction news generated successfully!",
        postId: newPost._id,
        postSlug: newPost.slug,
      },
      { status: 201 }
    );
  } catch (error: any) {
    let errorMessage = "Server error generating prediction news.";
    let clientStatus = 500;
    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes("AI determined content insufficient")) {
        clientStatus = 200;
      } else if (
        errorMessage.includes("AI output format error") ||
        errorMessage.includes("AI prediction title generation failed") ||
        errorMessage.includes("AI prediction content generation failed")
      ) {
        clientStatus = 422;
      } else if (errorMessage.includes("AI generation timed out")) {
        clientStatus = 504;
      } else if (errorMessage.includes("Fixture data not found")) {
        clientStatus = 404;
      } else if (axios.isAxiosError(error) && error.response) {
        errorMessage = `External API error: ${
          error.response.data?.error ||
          error.response?.data?.errors?.requests ||
          error.message
        }`;
        clientStatus = error.response.status || 500;
      } else if (errorMessage.includes("quota")) {
        errorMessage =
          "Gemini API Quota Exceeded. Please check your usage in Google AI Studio.";
        clientStatus = 429;
      }
    }
    console.error(
      `[Process Prediction Orchestrator] Critical error for fixture ${
        fixtureId || "unknown"
      }: ${errorMessage}`,
      "\nFull Error Object:",
      error
    );
    return NextResponse.json({ error: errorMessage }, { status: clientStatus });
  }
}
