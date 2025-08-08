// ===== src/app/[locale]/news/[slug]/page.tsx =====

import { notFound, redirect } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, IPostWithTranslations } from "@/models/Post"; // Import IPostWithTranslations
import { format } from "date-fns";
import Header from "@/components/Header";
import Image from "next/image";
import SocialShareButtons from "@/components/SocialShareButtons";
import NewsSidebar from "@/components/NewsSidebar";
import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { proxyImageUrl } from "@/lib/image-proxy";
import Script from "next/script";
import { generateHreflangTags } from "@/lib/hreflang";
import { generateTableOfContents } from "@/lib/toc";
import TableOfContents from "@/components/TableOfContents";
import { WithContext, NewsArticle, BreadcrumbList } from "schema-dts";
import StyledLink from "@/components/StyledLink";
import { ExternalLink } from "lucide-react";

const DEFAULT_LOCALE = "tr";
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// Simplified this function, as metadata generation will handle the rest
async function getPostAndHandleRedirects(
  slug: string,
  locale: string
): Promise<IPostWithTranslations | null> {
  await dbConnect();

  // Find a post that matches the slug, regardless of language
  const postInAnyLanguage = await Post.findOne({
    slug,
    status: "published",
  }).exec();

  if (!postInAnyLanguage) {
    return null; // This will trigger a 404 Not Found
  }

  // If the found post's language doesn't match the URL's locale, we must redirect.
  if (postInAnyLanguage.language !== locale) {
    const allTranslations = await postInAnyLanguage.getTranslations();
    const correctVersionForLocale = allTranslations.find(
      (p) => p.language === locale
    );

    let redirectUrl = "";
    if (correctVersionForLocale) {
      // Redirect to the correct slug for the requested locale
      const path = `/news/${correctVersionForLocale.slug}`;
      redirectUrl = `/${locale}${path}`;
    } else {
      // If no version for the requested locale exists, redirect to the default (Turkish) version
      const defaultVersion =
        allTranslations.find((p) => p.language === DEFAULT_LOCALE) ||
        allTranslations[0];
      const path = `/news/${defaultVersion.slug}`;
      redirectUrl =
        defaultVersion.language === DEFAULT_LOCALE
          ? path
          : `/${defaultVersion.language}${path}`;
    }
    redirect(redirectUrl);
  }

  // If we've reached here, the slug and locale match, so return the post.
  return postInAnyLanguage;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const post = await getPostAndHandleRedirects(slug, locale);

  if (!post) {
    return { title: "Not Found" };
  }

  // --- THIS IS THE FIX ---
  // 1. Get all available translations for this post.
  const allTranslations = await post.getTranslations();

  // 2. Pass this detailed translation info to our enhanced hreflang generator.
  const hreflangAlternates = await generateHreflangTags(
    "/news",
    slug,
    locale,
    allTranslations
  );
  // --- END OF FIX ---

  const description =
    post.metaDescription ||
    post.content.replace(/<[^>]*>?/gm, "").substring(0, 160);

  const imageUrl = post.featuredImage
    ? proxyImageUrl(post.featuredImage)
    : `${BASE_URL}/og-image.jpg`;

  return {
    title: post.metaTitle || `${post.title}`,
    description: description,
    alternates: hreflangAlternates,
    openGraph: {
      title: post.metaTitle || post.title,
      description: description,
      url: hreflangAlternates.canonical, // Use the correct canonical URL
      type: "article",
      publishedTime: new Date(post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [post.author || "Fan Skor"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}

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

  const postUrl = hreflangAlternates.canonical; // Use the canonical URL from the hreflang data
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
      author: { "@type": "Organization", name: "Fan Skor", url: BASE_URL },
      publisher: {
        "@type": "Organization",
        name: "Fan Skor",
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/fanskor-transparent.webp`,
        },
      },
      description: description,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("homepage"),
          item: `${BASE_URL}/${locale === DEFAULT_LOCALE ? "" : locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("news"),
          item: `${BASE_URL}/${locale === DEFAULT_LOCALE ? "" : locale}/news`,
        },
        { "@type": "ListItem", position: 3, name: post.title },
      ],
    },
  ];

  function getPath(path: string, locale: string) {
    if (locale === DEFAULT_LOCALE) return path;
    return `/${locale}${path}`;
  }

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
                {toc.length > 0 && <TableOfContents toc={toc} />}
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

export async function generateStaticParams() {
  await dbConnect();
  const posts = await Post.find({ status: "published" })
    .select("slug language")
    .lean();

  return posts.map((post) => ({
    slug: post.slug,
    locale: post.language,
  }));
}
