"use client";

import Image from "next/image";
import { IPost } from "@/models/Post";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";
import StyledLink from "./StyledLink";
import { useTranslation } from "@/hooks/useTranslation";

interface NewsCardProps {
  post: IPost;
  variant?: "featured" | "grid";
}

const categoryColors: Record<string, string> = {
  prediction: "bg-blue-500/20 text-blue-300",
  reviews: "bg-indigo-500/20 text-indigo-300",
  highlights: "bg-amber-500/20 text-amber-300",
  news: "bg-gray-500/20 text-gray-300",
};

export default function NewsCard({ post, variant = "grid" }: NewsCardProps) {
  const { t } = useTranslation();
  if (!post) return null;

  // Each post's link must be constructed with its own language
  const postUrl = `/${post.language}/news/${post.slug}`;
  const placeholderImage = "/images/placeholder-logo.svg";

  if (variant === "featured") {
    return (
      <StyledLink
        href={postUrl}
        className="block group relative rounded-xl overflow-hidden text-white shadow-lg shadow-black/30"
      >
        <div className="relative w-full aspect-video md:aspect-[2.4/1]">
          <Image
            src={post.featuredImage || placeholderImage}
            alt={post.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 ease-in-out group-hover:scale-105"
            priority // The featured image should load first
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block ${
              categoryColors[post.newsType] || categoryColors.news
            }`}
          >
            {t(post.newsType)}
          </span>
          <h2 className="font-extrabold text-2xl md:text-4xl leading-tight line-clamp-2 group-hover:text-brand-purple transition-colors">
            {post.title}
          </h2>
          <div className="flex items-center gap-4 text-sm text-brand-muted mt-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </div>
        </div>
      </StyledLink>
    );
  }

  // Grid variant
  return (
    <StyledLink
      href={postUrl}
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
      <div className="p-5 flex flex-col flex-grow">
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full mb-3 self-start ${
            categoryColors[post.newsType] || categoryColors.news
          }`}
        >
          {t(post.newsType)}
        </span>
        <h3 className="font-bold text-white leading-tight text-lg line-clamp-3 mb-3 flex-grow group-hover:text-brand-purple transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-brand-muted mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <time dateTime={new Date(post.createdAt).toISOString()}>
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </time>
          </div>
          <div className="flex items-center gap-1 text-brand-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {t("read_more")} <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </StyledLink>
  );
}

export const NewsCardSkeleton = ({
  variant = "grid",
}: {
  variant?: "featured" | "grid";
}) => {
  if (variant === "featured") {
    return (
      <div className="w-full aspect-video md:aspect-[2.4/1] bg-brand-secondary rounded-xl animate-pulse"></div>
    );
  }
  return (
    <div className="bg-brand-secondary rounded-xl animate-pulse">
      <div className="aspect-video w-full bg-gray-700/50"></div>
      <div className="p-5 space-y-3">
        <div className="h-4 w-1/3 bg-gray-700 rounded"></div>
        <div className="h-5 w-full bg-gray-700 rounded"></div>
        <div className="h-5 w-4/5 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};
