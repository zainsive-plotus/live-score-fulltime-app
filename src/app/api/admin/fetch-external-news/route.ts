// src/app/api/admin/fetch-external-news/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";
import axios from "axios";

// Define the expected structure of a newsdata.io article
interface NewsDataItem {
  article_id: string;
  title: string;
  link: string;
  keywords?: string[] | null;
  // This can be a string, an array of strings, or null from the API
  creator?: string | string[] | null;
  video_url?: string | null;
  description?: string | null;
  content?: string | null;
  pubDate: string; // ISO 8601 string
  image_url?: string | null;
  source_id?: string;
  source_priority?: number;
  source_url?: string;
  source_icon?: string | null;
  language?: string;
  country?: string[];
  category?: string[];
  sentiment?: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { query, language, country, category } = await request.json();

    const newsDataApiKey = process.env.NEXT_PUBLIC_NEWSDATA_IO_API_KEY;
    if (!newsDataApiKey) {
      return NextResponse.json(
        { error: "Server configuration error: News API key missing." },
        { status: 500 }
      );
    }

    const apiUrl = "https://newsdata.io/api/1/news";
    const params: Record<string, string | number> = {
      apikey: newsDataApiKey,
      qInTitle: query || "football OR soccer",
      language: language || "en",
    };
    if (country && country.length > 0) params.country = country.join(",");
    if (category && category.length > 0) params.category = category.join(",");

    const response = await axios.get(apiUrl, { params });
    const newsItems: NewsDataItem[] = response.data.results || [];

    let newArticlesCount = 0;
    let skippedArticlesCount = 0;
    let failedArticlesCount = 0;

    const processingPromises = newsItems.map(async (item) => {
      try {
        const existingArticle = await ExternalNewsArticle.findOne({
          articleId: item.article_id,
        });
        if (existingArticle) {
          return { status: "skipped" };
        }

        // --- DATA TRANSFORMATION LOGIC ---
        // Ensure `creator` is always an array of strings before saving.
        let creatorArray: string[] = [];
        if (item.creator) {
          creatorArray = Array.isArray(item.creator)
            ? item.creator
            : [item.creator];
        }

        const newArticle = new ExternalNewsArticle({
          articleId: item.article_id,
          title: item.title,
          link: item.link,
          creator: creatorArray, // Pass the sanitized array
          description: item.description,
          content: item.content,
          pubDate: new Date(item.pubDate),
          imageUrl: item.image_url,
          // ... other fields
          language: item.language,
          country: item.country || [],
          category: item.category || [],
          status: "fetched",
        });

        await newArticle.save();
        return { status: "saved" };
      } catch (saveError: any) {
        console.error(
          `[Fetch External News] Error saving article ${item.article_id}:`,
          saveError.message
        );
        return { status: "failed" };
      }
    });

    const results = await Promise.allSettled(processingPromises);

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.status === "saved") newArticlesCount++;
        if (result.value.status === "skipped") skippedArticlesCount++;
        if (result.value.status === "failed") failedArticlesCount++;
      } else {
        failedArticlesCount++;
      }
    });

    return NextResponse.json(
      {
        message: `Fetch complete. Saved: ${newArticlesCount}. Skipped: ${skippedArticlesCount}. Failed: ${failedArticlesCount}.`,
        newArticlesCount,
        skippedArticlesCount,
        failedArticlesCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[Fetch External News] Critical error fetching from newsdata.io:",
      error.message
    );
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: `Failed to fetch news from external API: ${
            error.response?.data?.results?.message || error.message
          }`,
        },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "Server error fetching external news." },
      { status: 500 }
    );
  }
}
