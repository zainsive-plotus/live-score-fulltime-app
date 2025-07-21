"use client";

import Image from "next/image";
import { IPost } from "@/models/Post";
import { formatDistanceToNow } from "date-fns";
import { Calendar, User } from "lucide-react";
import StyledLink from "./StyledLink";
import { useTranslation } from "@/hooks/useTranslation";

interface NewsListItemCompactProps {
  post: IPost;
}

const categoryColors: Record<string, string> = {
  prediction: "border-blue-500/50 text-blue-300",
  reviews: "border-indigo-500/50 text-indigo-300",
  highlights: "border-amber-500/50 text-amber-300",
  news: "border-gray-500/50 text-gray-400",
};

export function NewsListItemCompactSkeleton() {
  return (
    <div className="bg-brand-secondary rounded-lg p-4 flex flex-col sm:flex-row gap-4 md:gap-6 animate-pulse">
      <div className="w-full sm:w-40 md:w-48 flex-shrink-0">
        <div className="w-full aspect-video bg-gray-700 rounded-md"></div>
      </div>
      <div className="flex-1 flex flex-col space-y-3">
        <div className="h-4 w-1/4 bg-gray-600 rounded"></div>
        <div className="h-5 w-full bg-gray-600 rounded"></div>
        <div className="h-5 w-4/5 bg-gray-600 rounded"></div>
        <div className="flex-grow"></div> {/* Spacer */}
        <div className="h-3 w-1/2 bg-gray-700 rounded mt-2"></div>
      </div>
    </div>
  );
}

export default function NewsListItemCompact({
  post,
}: NewsListItemCompactProps) {
  const { t } = useTranslation();
  if (!post) return null;

  const postUrl = `/${post.language}/news/${post.slug}`;
  const placeholderImage = "/images/placeholder-logo.svg";

  return (
    <StyledLink
      href={postUrl}
      className="block group bg-brand-secondary rounded-lg transition-shadow duration-300 hover:shadow-xl hover:shadow-brand-purple/20"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 p-4">
        {/* Image Container */}
        <div className="w-full sm:w-40 md:w-48 flex-shrink-0">
          <div className="relative w-full aspect-video overflow-hidden rounded-md">
            <Image
              src={post.featuredImage || placeholderImage}
              alt={post.title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col self-stretch min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                categoryColors[post.newsType] || categoryColors.news
              }`}
            >
              {t(post.newsType)}
            </span>
          </div>

          <h3 className="font-bold text-white leading-tight text-lg md:text-xl line-clamp-2 mb-2 group-hover:text-brand-purple transition-colors">
            {post.title}
          </h3>

          {/* Excerpt - visible on medium screens and up */}
          {post.metaDescription && (
            <p className="hidden md:block text-sm text-brand-light line-clamp-2 mb-3">
              {post.metaDescription}
            </p>
          )}

          {/* Spacer to push metadata to the bottom */}
          <div className="flex-grow"></div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-brand-muted mt-2">
            <div className="flex items-center gap-1.5" title="Author">
              <User size={12} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Publish Date">
              <Calendar size={12} />
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </div>
        </div>
      </div>
    </StyledLink>
  );
}
