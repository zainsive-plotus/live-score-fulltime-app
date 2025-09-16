// src/app/[locale]/news/[slug]/page.tsx

import { notFound, redirect } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, IPostWithTranslations } from "@/models/Post";
import { format } from "date-fns";
import Header from "@/components/Header";
import Image from "next/image";
import SocialShareButtons from "@/components/SocialShareButtons";
import NewsSidebar from "@/components/NewsSidebar";
import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import Script from "next/script";
import { generateHreflangTags } from "@/lib/hreflang";
import { generateTableOfContents } from "@/lib/toc";
import { WithContext, NewsArticle, BreadcrumbList } from "schema-dts";
import StyledLink from "@/components/StyledLink";
import { ExternalLink } from "lucide-react";
import redis from "@/lib/redis";

// This enables Incremental Static Regeneration (ISR).
// Pages are built statically and will revalidate at most once per hour.
export const revalidate = 3600;

const DEFAULT_LOCALE = "tr";
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getPostAndHandleRedirects = async (
  slug: string,
  locale: string
): Promise<IPostWithTranslations | null> => {
  await dbConnect();
  const postInAnyLanguage = await Post.findOne({
    slug,
    status: "published",
  }).lean();
  if (!postInAnyLanguage) return null;
  if (postInAnyLanguage.language !== locale) {
    // Handle redirect logic if necessary, though generateMetadata won't use it.
  }
  // Re-attach methods if needed for the page component
  const postWithMethod = new Post(postInAnyLanguage);
  return postWithMethod;
};

// --- THIS IS THE NEW, ROBUST METADATA FUNCTION ---
export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;

  try {
    // 1. All required data is sourced synchronously from params.
    const t = await getI18n(locale);

    // 2. Reconstruct a readable title from the slug.
    // Example: "my-great-article" -> "My Great Article"
    const titleFromSlug = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // 3. Generate title and description using translation templates.
    // These keys should exist in your translation files.
    const title = `${titleFromSlug} | Fanskor News`;

    const description = `Read the latest news and analysis on ${titleFromSlug}. Get all the details on Fanskor.`;

    // 4. Construct canonical URL and hreflang tags. This is the only async part.
    const path = `/news/${slug}`;
    const canonicalUrl =
      locale === DEFAULT_LOCALE
        ? `${BASE_URL}${path}`
        : `${BASE_URL}/${locale}${path}`;

    // Note: To get full hreflang, a DB call is unavoidable.
    // To be 100% free of DB calls here, you could omit hreflang alternates
    // and only return the canonical tag.
    const hreflangAlternates = await generateHreflangTags(
      "/news",
      slug,
      locale
    );

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: hreflangAlternates.languages,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "article",
        // Generic image as we don't have the specific post's image without a DB call
        images: [
          {
            url: `${BASE_URL}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
    };
  } catch (error) {
    console.error(
      `[Metadata Generation Error] Critical failure for slug "${slug}":`,
      error
    );
    // 5. Ultimate fallback in case of any unexpected error (e.g., i18n fails).
    return {
      title: "News Article | Fanskor",
      description: "Read the latest news, updates, and analysis on Fanskor.",
      robots: { index: false }, // Don't index a page if its metadata failed
    };
  }
}

// This function tells Next.js to pre-build all published posts.
// export async function generateStaticParams() {
//   console.log(
//     "[generateStaticParams/News] Fetching all published posts to pre-build..."
//   );
//   await dbConnect();
//   const posts = await Post.find({ status: "published" })
//     .select("slug language")
//     .lean();
//   console.log(
//     `[generateStaticParams/News] Found ${posts.length} posts to generate.`
//   );

//   return posts.map((post) => ({
//     slug: post.slug,
//     locale: post.language,
//   }));
// }

export default async function GeneralNewsArticlePage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const { slug, locale } = params;
  const post = await getPostAndHandleRedirects(slug, locale);

  if (!post) {
    notFound();
  }

  const t = await getI18n(locale);
  const { processedHtml, toc } = generateTableOfContents(post.content);
  const allTranslations = await post.getTranslations();
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
          item: `${BASE_URL}/${locale === DEFAULT_LOCALE ? "" : locale}/news`,
        },
        { "@type": "ListItem", position: 2, name: post.title },
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
                    layout="fill"
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
                    isExternal={true}
                    className="inline-flex items-center gap-2 bg-brand-purple text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity my-4"
                  >
                    <ExternalLink size={18} />
                    {t("read_full_story_on_source")}
                  </StyledLink>
                )}
                {/* {toc.length > 0 && <TableOfContents toc={toc} />} */}
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
