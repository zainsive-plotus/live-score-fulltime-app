// ===== src/app/[locale]/news/category/[category]/NewsArchiveClient.tsx =====

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost, NewsType, SportsCategory } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";
import { Info, ExternalLink, Calendar, User } from "lucide-react";
import Pagination from "@/components/Pagination";
import StyledLink from "@/components/StyledLink";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { NewsListItemCompactSkeleton } from "@/components/NewsListItemCompact";

const ITEMS_PER_PAGE = 10;

// --- Start of New Data Fetching Logic ---
const fetchArchiveNews = async (
  locale: string,
  category: string,
  page: number
) => {
  const params = new URLSearchParams({
    language: locale,
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
  });

  if (category === "football") params.set("sportsCategory", "football");
  if (category === "transfer") params.set("newsType", "transfer");
  if (category === "recent") params.set("newsType", "recent");

  const { data } = await axios.get(`/api/posts?${params.toString()}`);
  return data;
};
// --- End of New Data Fetching Logic ---

interface NewsArchiveClientProps {
  initialData: {
    posts: IPost[];
    pagination: { totalPages: number };
  };
  category: string;
}

const ArchiveNewsItem = ({ item }: { item: IPost }) => {
  const placeholderImage = "/images/placeholder-logo.svg";
  const isExternal = !!item.originalSourceUrl;
  const href = `/news/${item.slug}`;

  return (
    <StyledLink
      href={href}
      className="block group bg-brand-secondary rounded-lg transition-shadow duration-300 hover:shadow-xl hover:shadow-brand-purple/20"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 p-4">
        <div className="w-full sm:w-40 md:w-48 flex-shrink-0">
          <div className="relative w-full aspect-video overflow-hidden rounded-md">
            <Image
              src={item.featuredImage || placeholderImage}
              alt={item.title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col self-stretch min-w-0">
          <h3 className="font-bold text-white leading-tight text-lg md:text-xl line-clamp-2 mb-2 group-hover:text-brand-purple transition-colors">
            {item.title}
          </h3>
          <p className="hidden md:block text-sm text-brand-light line-clamp-2 mb-3">
            {item.metaDescription || item.content.replace(/<[^>]*>?/gm, "")}
          </p>
          <div className="flex-grow"></div>
          <div className="flex items-center gap-4 text-xs text-brand-muted mt-2">
            <div className="flex items-center gap-1.5" title="Author">
              <User size={12} />
              <span>{item.author}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Publish Date">
              <Calendar size={12} />
              <time dateTime={new Date(item.createdAt).toISOString()}>
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                })}
              </time>
            </div>
            {isExternal && (
              <div
                className="flex items-center gap-1.5 text-blue-400"
                title="External Link available"
              >
                <ExternalLink size={12} />
                <span>Source Available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </StyledLink>
  );
};

export default function NewsArchiveClient({
  initialData,
  category,
}: NewsArchiveClientProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  // --- Start of Client-Side Fetching Logic ---
  const { data, isLoading } = useQuery({
    queryKey: ["archiveNews", category, currentPage, locale],
    queryFn: () => fetchArchiveNews(locale, category, currentPage),
    initialData: initialData, // Use server data for the first page load
    staleTime: 1000 * 60, // 1 minute
  });
  // --- End of Client-Side Fetching Logic ---

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <NewsListItemCompactSkeleton />
        <NewsListItemCompactSkeleton />
        <NewsListItemCompactSkeleton />
        <NewsListItemCompactSkeleton />
        <NewsListItemCompactSkeleton />
      </div>
    );
  }

  if (!data?.posts || data.posts.length === 0) {
    return (
      <div className="text-center py-20 bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto text-brand-muted mb-3" />
        <p className="text-xl font-bold text-white">
          {t("no_news_found_title")}
        </p>
        <p className="text-brand-muted mt-2">
          {t("no_news_in_category_subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.posts.map((item: any) => (
        <ArchiveNewsItem key={item._id as string} item={item} />
      ))}

      {data.pagination.totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={data.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
