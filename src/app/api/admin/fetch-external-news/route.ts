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
  creator?: string | null;
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
    const { query, language, country, category, count } = await request.json(); // Allow client to specify filters and count

    const newsDataApiKey = process.env.NEXT_PUBLIC_NEWSDATA_IO_API_KEY;
    if (!newsDataApiKey) {
      console.error("NEWSDATA_IO_API_KEY is not set in environment variables.");
      return NextResponse.json(
        { error: "Server configuration error: News API key missing." },
        { status: 500 }
      );
    }

    const apiUrl = "https://newsdata.io/api/1/news";
    const params: Record<string, string | number> = {
      apikey: newsDataApiKey,
      // We are only using qInTitle to avoid the 'TooManyQueryFilter' error.
      qInTitle: query || "football OR soccer", // Use qInTitle as the primary query filter
      language: language || "en", // Default language
    };

    if (country && country.length > 0) {
      params.country = country.join(",");
    }
    if (category && category.length > 0) {
      params.category = category.join(",");
    }

    console.log(
      `[Fetch External News] Fetching news from newsdata.io with params: ${JSON.stringify(
        params
      )}`
    );
    const response = await axios.get(apiUrl, { params });
    const newsItems: NewsDataItem[] = response.data.results || [];
    console.log(
      `[Fetch External News] Received ${newsItems.length} articles from newsdata.io`
    );

    let newArticlesCount = 0;
    let skippedArticlesCount = 0;

    for (const item of newsItems) {
      try {
        // Only save if the article_id is unique
        const existingArticle = await ExternalNewsArticle.findOne({
          articleId: item.article_id,
        });
        if (existingArticle) {
          skippedArticlesCount++;
          console.warn(
            `[Fetch External News] Duplicate article ID found, skipping: ${item.article_id}`
          );
          continue; // Skip if article already exists
        }

        const newArticle = new ExternalNewsArticle({
          articleId: item.article_id,
          title: item.title,
          link: item.link,
          keywords: item.keywords || undefined,
          creator: item.creator,
          video_url: item.video_url,
          description: item.description,
          content: item.content,
          pubDate: new Date(item.pubDate), // Convert to Date object
          imageUrl: item.image_url,
          source_id: item.source_id,
          source_priority: item.source_priority,
          source_url: item.source_url,
          source_icon: item.source_icon,
          language: item.language,
          country: item.country || undefined,
          category: item.category || undefined,
          sentiment: item.sentiment,
          status: "fetched", // Initial status
        });

        await newArticle.save();
        newArticlesCount++;
        console.log(`[Fetch External News] Saved new article: ${item.title}`);
      } catch (saveError: any) {
        // Handle duplicate key errors or other save errors gracefully
        if (saveError.code === 11000) {
          // MongoDB duplicate key error
          skippedArticlesCount++;
          console.warn(
            `[Fetch External News] Duplicate article ID found during save, skipping: ${item.article_id}`
          );
        } else {
          console.error(
            `[Fetch External News] Error saving article ${item.article_id}:`,
            saveError
          );
        }
      }
    }

    return NextResponse.json(
      {
        message: `Successfully fetched and saved ${newArticlesCount} new articles. Skipped ${skippedArticlesCount} existing articles.`,
        newArticlesCount,
        skippedArticlesCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[Fetch External News] Error fetching external news:",
      error.message
    );
    if (axios.isAxiosError(error)) {
      console.error("newsdata.io API error response:", error.response?.data);
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
