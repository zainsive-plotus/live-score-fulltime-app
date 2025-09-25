// ===== src/app/[locale]/news/[slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import Script from "next/script";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { WithContext, NewsArticle, BreadcrumbList } from "schema-dts";

// Local Application Imports
import dbConnect from "@/lib/dbConnect";
import Post, { IPostWithTranslations } from "@/models/Post";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags, TranslationInfo } from "@/lib/hreflang";
import { generateTableOfContents } from "@/lib/toc";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

// Components
import Header from "@/components/Header";
import SocialShareButtons from "@/components/SocialShareButtons";
import NewsSidebar from "@/components/NewsSidebar";
import StyledLink from "@/components/StyledLink";

// --- NEW: Incremental Static Regeneration (ISR) ---
// This tells Next.js to re-generate the page on-demand, at most once every hour.
// 3600 seconds = 1 hour. Adjust as needed.
export const revalidate = 3600;

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// --- NEW: generateStaticParams for SSG ---
// This function runs at build time to tell Next.js which pages to pre-render.
export async function generateStaticParams() {
  try {
    await dbConnect();
    const posts = await Post.find({ status: "published" })
      .select("slug language")
      .lean();

    // We need to return an array of objects with `locale` and `slug` params
    return posts.map((post) => ({
      locale: post.language,
      slug: post.slug,
    }));
  } catch (error) {
    console.error(
      "[generateStaticParams] Failed to fetch posts for static generation:",
      error
    );
    return []; // Return an empty array on error to prevent build failure
  }
}

// --- Data Fetching for Metadata (Redis-First) ---
async function getPostDataForPage(
  slug: string,
  locale: string
): Promise<IPostWithTranslations | null> {
  await dbConnect();
  // Ensure the model is correctly cast to include the method
  const post = await Post.findOne({
    slug,
    language: locale,
    status: "published",
  }).lean();
  if (!post) return null;
  // Re-instantiate as a Mongoose document to access methods
  return new Post(post);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const post = await getPostDataForPage(slug, locale);

  const path = `/news/${slug}`;

  if (!post) {
    const canonicalUrl =
      locale === DEFAULT_LOCALE
        ? `${BASE_URL}${path}`
        : `${BASE_URL}/${locale}${path}`;
    return {
      title: "Not Found",
      robots: { index: false },
      alternates: { canonical: canonicalUrl },
    };
  }

  // NEW: Fetch all translations for hreflang
  const allTranslations = (await post.getTranslations()) as TranslationInfo[];
  const hreflangAlternates = await generateHreflangTags(
    "/news",
    slug,
    locale,
    allTranslations
  );

  const title = post.metaTitle || post.title;
  const description =
    post.metaDescription || "Read the latest news on Fanskor.";
  const imageUrl = post.featuredImage || `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    alternates: hreflangAlternates, // USE THE GENERATED HREFLANG OBJECT
    openGraph: {
      title,
      description,
      url: hreflangAlternates.canonical, // Use the canonical URL from the helper
      type: "article",
      publishedTime: post.createdAt.toString(),
      modifiedTime: post.updatedAt.toString(),
      authors: [post.author],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.featuredImageAltText || title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

// --- Page Component ---
export default async function GeneralNewsArticlePage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const { slug, locale } = params;
  const post = await getPostDataForPage(slug, locale);

  if (!post) {
    notFound();
  }

  const t = await getI18n(locale);
  const { processedHtml, toc } = generateTableOfContents(post.content);
  const allTranslations = (await post.getTranslations()) as TranslationInfo[];
  const hreflangAlternates = await generateHreflangTags(
    "/news",
    slug,
    locale,
    allTranslations
  );

  const postUrl = hreflangAlternates.canonical;
  const description =
    post.metaDescription ||
    post.content.replace(/<[^>]*>?/gm, "").substring(0, 160);
  const imageUrl = post.featuredImage || `${BASE_URL}/og-image.jpg`;

  const pageUrl = `${BASE_URL}/${locale}/news/${slug}`;
  const jsonLd: WithContext<NewsArticle | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
      headline: post.title,
      image: [imageUrl],
      datePublished: new Date(post.createdAt).toISOString(),
      dateModified: new Date(post.updatedAt).toISOString(),
      author: { "@type": "Organization", name: "Fanskor", url: BASE_URL },
      publisher: {
        "@type": "Organization",
        name: "Fanskor",
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/fanskor-transparent.webp`,
        },
      },
      description: description,
      articleBody: post.content.replace(/<[^>]*>?/gm, ""),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("news"),
          item: `${BASE_URL}/${locale}/news`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: post.title,
          item: pageUrl, // Add the URL for the current page
        },
      ],
    },
  ];

  return (
    <>
      <Script
        id="news-article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-brand-dark min-h-screen">
        <Header />
        <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-2">
            <article className="bg-brand-secondary rounded-lg overflow-hidden">
              {post.featuredImage && (
                <div className="relative w-full aspect-video md:h-[500px]">
                  <Image
                    src={post.featuredImage}
                    alt={post.featuredImageAltText || post.title}
                    title={post.featuredImageTitle || post.title}
                    fill
                    objectFit="cover"
                    priority
                  />
                </div>
              )}
              <div className="p-4 sm:p-6 md:p-8">
                <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                  {post.title}
                </h1>
                <p className="text-brand-muted mb-6 pb-6 border-b border-gray-700/50">
                  {t("published_by_on", {
                    author: post.author,
                    date: format(new Date(post.createdAt), "MMMM dd, yyyy"),
                  })}
                </p>
                {post.originalSourceUrl && (
                  <StyledLink
                    href={post.originalSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 bg-brand-purple text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity my-4"
                  >
                    <ExternalLink size={18} />
                    {t("read_full_story_on_source")}
                  </StyledLink>
                )}
                {/* {toc.length > 1 && <TableOfContents toc={toc} />} */}
                <div
                  className="prose prose-invert prose-lg lg:prose-xl max-w-none mt-8"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
                <div className="mt-12 pt-8 border-t border-gray-700/50">
                  <h3 className="text-lg font-bold text-center text-brand-muted mb-4">
                    {t("share_this_article")}
                  </h3>
                  <SocialShareButtons url={postUrl} title={post.title} />
                </div>
              </div>
            </article>
          </div>
          <div className="lg:col-span-1">
            <NewsSidebar />
          </div>
        </main>
      </div>
    </>
  );
}
