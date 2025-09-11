// ===== src/app/[locale]/news/NewsPageClient.tsx =====

"use client";

import { IPost } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowRight, Flame, Repeat, Newspaper } from "lucide-react";
import NewsCard from "@/components/NewsCard";
import StyledLink from "@/components/StyledLink";
import NewsListItemCompact from "@/components/NewsListItemCompact";

interface NewsPageClientProps {
  recentNews: IPost[];
  footballNews: IPost[];
  transferNews: IPost[];
}

const SectionHeader = ({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
}) => {
  const { t } = useTranslation();
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
  );
};

export default function NewsPageClient({
  recentNews,
  footballNews,
  transferNews,
}: NewsPageClientProps) {
  const { t } = useTranslation();

  // --- CORE CHANGE: Football News is now the featured content ---
  const featuredFootballArticle = footballNews?.[0];
  const subFeaturedFootballArticles = footballNews?.slice(1, 9) || []; // Grid of up to 8 articles

  return (
    <div className="space-y-16">
      {/* --- NEW: Featured Football News Section --- */}
      {featuredFootballArticle && (
        <section>
          <SectionHeader
            title={t("football_news_title")}
            href="/news/category/football"
            icon={<Flame className="text-amber-400" />}
          />

          {/* Large featured article card */}
          <NewsCard post={featuredFootballArticle} variant="featured" />

          {/* Grid for other football articles */}
          {subFeaturedFootballArticles.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {subFeaturedFootballArticles.map((post) => (
                <NewsCard key={post._id as string} post={post} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* --- Recent News Section (Now second) --- */}
      {recentNews.length > 0 && (
        <section>
          <SectionHeader
            title={t("recent_news_title")}
            href="/news/category/recent"
            icon={<Newspaper className="text-sky-400" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNews.map((post) => (
              <NewsListItemCompact key={post._id as string} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* --- Transfer News Section (Remains last) --- */}
      {transferNews.length > 0 && (
        <section>
          <SectionHeader
            title={t("transfer_news_title")}
            href="/news/category/transfer"
            icon={<Repeat className="text-sky-400" />}
          />
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
