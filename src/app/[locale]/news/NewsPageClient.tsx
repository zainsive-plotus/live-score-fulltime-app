// ===== src/app/[locale]/news/NewsPageClient.tsx =====

"use client";

import { IPost } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowRight, Flame, Repeat, Calendar, ExternalLink, Newspaper } from "lucide-react";
import NewsCard from "@/components/NewsCard";
import StyledLink from "@/components/StyledLink";
import NewsListItemCompact from "@/components/NewsListItemCompact";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

const RecentNewsCard = ({ post, variant = "grid" }: { post: IPost, variant?: "featured" | "grid" }) => {
  const { t } = useTranslation();
  const placeholderImage = "/images/placeholder-logo.svg";

  const isExternal = !!post.originalSourceUrl;
  const href = `/news/${post.slug}`;

  if (variant === "featured") {
    return (
      <StyledLink
        href={href}
        className="block group relative rounded-xl overflow-hidden text-white shadow-lg shadow-black/30"
      >
        <div className="relative w-full aspect-video md:aspect-[2.4/1]">
          <Image
            src={post.featuredImage || placeholderImage}
            alt={post.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 ease-in-out group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          {post.newsType === 'recent' && (
            <span className="text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block bg-sky-500/10 text-sky-300">
              {t("latest_from_web")}
            </span>
          )}
          <h2 className="font-extrabold text-2xl md:text-4xl leading-tight line-clamp-2 group-hover:text-brand-purple transition-colors">
            {post.title}
          </h2>
           <div className="flex items-center gap-4 text-sm text-brand-muted mt-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </time>
            </div>
             {isExternal && (
                <div className="flex items-center gap-1.5 text-blue-400">
                    <ExternalLink size={14} />
                    <span>{t("read_on_source")}</span>
                </div>
             )}
          </div>
        </div>
      </StyledLink>
    );
  }

  return (
    <StyledLink
      href={href}
      className="block group bg-brand-secondary rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-purple/20 border border-gray-800/50 hover:border-brand-purple/30"
    >
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={post.featuredImage || placeholderImage}
          alt={post.title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        {post.newsType === 'recent' && <span className="text-xs font-bold text-sky-300 mb-2">{t("latest_from_web")}</span>}
        <h3 className="font-bold text-white leading-tight text-base line-clamp-3 flex-grow group-hover:text-brand-purple transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-3">
            <Calendar size={12} />
            <time dateTime={new Date(post.createdAt).toISOString()}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </time>
        </div>
      </div>
    </StyledLink>
  );
};


interface NewsPageClientProps {
  recentNews: IPost[];
  footballNews: IPost[];
  transferNews: IPost[];
}

const SectionHeader = ({ title, href, icon }: { title: string; href: string; icon: React.ReactNode }) => {
    const {t} = useTranslation()
    return (
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            {icon}
            {title}
            </h2>
            <StyledLink
            href={href}
            className="flex items-center gap-1 text-sm font-semibold text-text-muted transition-colors hover:text-white"
            >
            {t("see_all")}
            <ArrowRight size={16} />
            </StyledLink>
        </div>
    )
};

export default function NewsPageClient({
  recentNews,
  footballNews,
  transferNews,
}: NewsPageClientProps) {
  const { t } = useTranslation();
  const featuredArticle = recentNews?.[0];
  const subFeaturedArticles = recentNews?.slice(1, 5) || [];

  return (
    <div className="space-y-16">
      {/* === RECENT NEWS (FEATURED) SECTION === */}
      {featuredArticle && (
        <section>
          <SectionHeader title={t("recent_news_title")} href="/news/category/recent" icon={<Newspaper className="text-sky-400" />} />
          <RecentNewsCard post={featuredArticle} variant="featured" />
          {subFeaturedArticles.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {subFeaturedArticles.map((post) => (
                <RecentNewsCard key={post._id as string} post={post} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* === FOOTBALL NEWS SECTION === */}
      {footballNews.length > 0 && (
        <section>
          <SectionHeader title={t("football_news_title")} href="/news/category/football" icon={<Flame className="text-amber-400" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {footballNews.map((post) => (
              <NewsCard key={post._id as string} post={post} />
            ))}
          </div>
        </section>
      )}
      
      {/* === TRANSFER NEWS SECTION === */}
      {transferNews.length > 0 && (
        <section>
          <SectionHeader title={t("transfer_news_title")} href="/news/category/transfer" icon={<Repeat className="text-sky-400" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transferNews.map((post) => (
                <NewsListItemCompact key={post._id as string} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}