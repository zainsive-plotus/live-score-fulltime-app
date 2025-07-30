// ===== src/app/[locale]/news/category/[category]/NewsArchiveClient.tsx =====

"use client";

import { useState, useMemo } from "react";
import { IPost } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";
import { Info, ExternalLink, Calendar, User } from "lucide-react";
import Pagination from "@/components/Pagination";
import StyledLink from "@/components/StyledLink";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 10;

interface NewsArchiveClientProps {
  initialNews: IPost[];
}

// A generic list item that can handle both internal and external (curated) posts
const ArchiveNewsItem = ({ item }: { item: IPost }) => {
  const placeholderImage = "/images/placeholder-logo.svg";
  const isExternal = !!item.originalSourceUrl;
  
  // Link to the internal detail page regardless of the source
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
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </time>
            </div>
            {isExternal && (
                <div className="flex items-center gap-1.5 text-blue-400" title="External Link available">
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


export default function NewsArchiveClient({ initialNews }: NewsArchiveClientProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const { paginatedData, totalPages } = useMemo(() => {
    const newsArray = Array.isArray(initialNews) ? initialNews : [];
    const total = Math.ceil(newsArray.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      paginatedData: newsArray.slice(startIndex, endIndex),
      totalPages: total,
    };
  }, [initialNews, currentPage]);

  if (!initialNews || initialNews.length === 0) {
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
      {paginatedData.map((item) => (
        <ArchiveNewsItem key={item._id as string} item={item} />
      ))}

      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}