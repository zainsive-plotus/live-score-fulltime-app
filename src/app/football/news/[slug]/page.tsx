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
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) {
    return { title: "Not Found" };
  }

  const description =
    post.metaDescription ||
    post.content.replace(/<[^>]*>?/gm, "").substring(0, 160);
  const imageUrl = post.featuredImage
    ? proxyImageUrl(post.featuredImage)
    : `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/og-image.jpg`;

  return {
    title: post.metaTitle || `${post.title} | Fan Skor`,
    description: description,
    alternates: {
      canonical: `/football/news/${post.slug}`,
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description: description,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/football/news/${post.slug}`,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
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
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  const t = await getI18n();

  if (!post) {
    notFound();
  }

  const postUrl = `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/football/news/${post.slug}`;
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
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
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
                <div className="relative w-full h-64 md:h-96">
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

              <div className="p-8">
                <div className="mb-8 text-center border-b border-gray-700/50 pb-8">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                    {post.title}
                  </h1>
                  <p className="text-brand-muted">
                    {t("published_by_on", {
                      author: post.author,
                      date: format(new Date(post.createdAt), "MMMM dd, yyyy"),
                    })}
                  </p>
                </div>

                <div
                  className="prose prose-invert lg:prose-xl max-w-none"
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

          <div className="lg:col-span-1">
            <NewsSidebar />
          </div>
        </main>
      </div>
    </>
  );
}

// This function can remain as is
export async function generateStaticParams() {
  await dbConnect();
  const posts = await Post.find({ status: "published" }).select("slug").lean();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
