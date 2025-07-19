import { notFound, redirect } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
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

const DEFAULT_LOCALE = "tr";

async function getPostAndTranslations(
  slug: string,
  locale: string
): Promise<{ postToRender: IPost; allTranslations: IPost[] } | null> {
  await dbConnect();

  let initialPost = await Post.findOne({
    slug,
    language: locale,
    status: "published",
  }).lean();

  if (!initialPost) {
    initialPost = await Post.findOne({ slug, status: "published" }).lean();
  }

  if (!initialPost) {
    return null;
  }

  const translationGroupId = initialPost.translationGroupId;

  const allTranslations = await Post.find({
    translationGroupId,
    status: "published",
  }).lean();

  if (allTranslations.length === 0) {
    return null;
  }

  let postToRender = allTranslations.find((p) => p.language === locale);
  if (!postToRender) {
    postToRender = allTranslations.find((p) => p.language === DEFAULT_LOCALE);
  }
  if (!postToRender) {
    postToRender = allTranslations[0];
  }

  return {
    postToRender: postToRender as IPost,
    allTranslations: allTranslations as IPost[],
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const data = await getPostAndTranslations(slug, locale);

  if (!data) {
    return { title: "Not Found" };
  }

  const { postToRender, allTranslations } = data;

  const pagePath = `/news/${postToRender.slug}`;
  // We need to update hreflang generation to accept the list of available locales for this specific page
  const availableLocales = allTranslations.map((p) => p.language);
  const hreflangAlternates = generateHreflangTags(
    pagePath,
    locale,
    availableLocales
  );

  const description =
    postToRender.metaDescription ||
    postToRender.content.replace(/<[^>]*>?/gm, "").substring(0, 160);

  const imageUrl = postToRender.featuredImage
    ? proxyImageUrl(postToRender.featuredImage)
    : `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/og-image.jpg`;

  return {
    title: postToRender.metaTitle || `${postToRender.title} | Fan Skor`,
    description: description,
    alternates: hreflangAlternates,
    openGraph: {
      title: postToRender.metaTitle || postToRender.title,
      description: description,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${locale}${pagePath}`,
      type: "article",
      publishedTime: new Date(postToRender.createdAt).toISOString(),
      modifiedTime: new Date(postToRender.updatedAt).toISOString(),
      authors: [postToRender.author || "Fan Skor"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: postToRender.title,
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
  const data = await getPostAndTranslations(slug, locale);

  if (!data) {
    notFound();
  }

  const { postToRender } = data;

  if (postToRender.language !== locale) {
    const correctPath = `/${postToRender.language}/news/${postToRender.slug}`;
    redirect(correctPath);
  }

  const post = postToRender;
  const t = await getI18n(locale);

  const pagePath = `/news/${post.slug}`;
  const postUrl = `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${locale}${pagePath}`;
  const description =
    post.metaDescription ||
    post.content.replace(/<[^>]*>?/gm, "").substring(0, 160);
  const imageUrl =
    post.featuredImage ||
    `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/og-image.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    headline: post.title,
    image: imageUrl,
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      "@type": "Organization",
      name: post.author || "Fan Skor",
    },
    publisher: {
      "@type": "Organization",
      name: "Fan Skor",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/fanskor-transparent.webp`,
      },
    },
    description: description,
  };

  return (
    <>
      <Script
        id="news-article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-brand-dark min-h-screen">
        <Header />
        <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
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

                <div
                  className="prose prose-invert prose-lg lg:prose-xl max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
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

          <div className="lg:col-span-1 p-4 lg:p-0">
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
