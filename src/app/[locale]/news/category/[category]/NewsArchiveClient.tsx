// ===== src/app/[locale]/news/category/[category]/NewsArchiveClient.tsx =====

"use client";

import { useEffect, Fragment } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import axios from "axios";
import { IPost } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";
import { Info, ExternalLink, Calendar, User } from "lucide-react";
import StyledLink from "@/components/StyledLink";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { NewsListItemCompactSkeleton } from "@/components/NewsListItemCompact";

const ITEMS_PER_PAGE = 10;

// The query function now accepts a pageParam from useInfiniteQuery
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
  return data as {
    posts: IPost[];
    pagination: { totalPages: number; totalCount: number };
  };
};

interface NewsArchiveClientProps {
  initialData: {
    posts: IPost[];
    pagination: { totalPages: number; totalCount: number };
  };
  category: string;
}

const ArchiveNewsItem = ({ item }: { item: IPost }) => {
  const placeholderImage = "/images/placeholder-logo.svg";
  const isExternal = !!item.originalSourceUrl;
  const href = `/${item.language}/news/${item.slug}`;

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
  const { ref, inView } = useInView(); // Hook to detect when an element is visible

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["archiveNews", category, locale],
    queryFn: ({ pageParam = 1 }) =>
      fetchArchiveNews(locale, category, pageParam),
    initialPageParam: 1,
    // This function determines the next page number
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination.totalPages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    // Format the initial server-fetched data for useInfiniteQuery
    initialData: {
      pages: [initialData],
      pageParams: [1],
    },
  });

  // Effect to fetch more data when the trigger element becomes visible
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
          <NewsListItemCompactSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data?.pages[0]?.posts || data.pages[0].posts.length === 0) {
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
      {/* Map through the 'pages' array and then map through the 'posts' in each page */}
      {data.pages.map((page, i) => (
        <Fragment key={i}>
          {page.posts.map((item: IPost) => (
            <ArchiveNewsItem key={item._id as string} item={item} />
          ))}
        </Fragment>
      ))}

      {/* This is the trigger element. When it's in view, we fetch more data */}
      <div ref={ref} className="h-10">
        {isFetchingNextPage && (
          <div className="space-y-4 pt-4">
            <NewsListItemCompactSkeleton />
            <NewsListItemCompactSkeleton />
          </div>
        )}
        {!hasNextPage &&
          data.pages[0].pagination.totalCount > ITEMS_PER_PAGE && (
            <p className="text-center text-brand-muted py-4">
              You've reached the end.
            </p>
          )}
      </div>
    </div>
  );
}
