import { notFound } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
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

async function getPost(slug: string) {
  await dbConnect();
  const post: any = await Post.findOne({
    slug: slug,
    status: "published",
  }).lean();
  if (!post) {
    return null;
  }
  return post;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Not Found" };
  }

  const pagePath = `/football/news/${post.slug}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);

  const description =
    post.metaDescription ||
    post.content.replace(/<[^>]*>?/gm, "").substring(0, 160);

  const imageUrl = post.featuredImage
    ? proxyImageUrl(post.featuredImage)
    : `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/og-image.jpg`;

  return {
    title: post.metaTitle || `${post.title} | Fan Skor`,
    description: description,
    alternates: hreflangAlternates,
    openGraph: {
      title: post.metaTitle || post.title,
      description: description,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${locale}${pagePath}`,
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

export default async function NewsArticlePage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const { slug, locale } = params;
  const post = await getPost(slug);
  const t = await getI18n(locale);

  if (!post) {
    notFound();
  }

  const pagePath = `/football/news/${post.slug}`;
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
        {/* Main content area now has no padding on small screens to allow full-width image */}
        <main className="container mx-auto md:p-8 grid grid-cols-1 lg:grid-cols-3 lg:gap-12 z-0">
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

              {/* Padding is now inside this div, not on the main tag */}
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

                {/* Adjusted prose classes for better mobile readability */}
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

          {/* Sidebar now has padding on mobile to separate it from the article */}
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
  const posts = await Post.find({ status: "published" }).select("slug").lean();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
