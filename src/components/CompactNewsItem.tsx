// ===== src/components/CompactNewsItem.tsx =====

"use client";

import Image from "next/image";
import Link from "next/link"; // Can be a direct Next.js Link
import { IPost } from "@/models/Post";
import { formatDistanceToNow } from "date-fns";
import { Calendar, User } from "lucide-react";
import StyledLink from "./StyledLink"; // Keep using StyledLink for consistency

interface CompactNewsItemProps {
  post: IPost;
}

export function CompactNewsItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-24 h-16 bg-gray-700 rounded-md flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-5 w-full bg-gray-600 rounded"></div>
        <div className="h-5 w-4/5 bg-gray-600 rounded"></div>
        <div className="h-3 w-1/3 bg-gray-700 rounded mt-3"></div>
      </div>
    </div>
  );
}

export default function CompactNewsItem({ post }: CompactNewsItemProps) {
  if (!post) return null;

  // --- THIS IS THE FIX ---
  // The href is now root-relative, without the language prefix.
  // StyledLink will handle adding the correct /en, /fr, etc. prefix.
  const postUrl = `/news/${post.slug}`;
  // --- END OF FIX ---

  const placeholderImage = "/images/placeholder-logo.svg";

  return (
    <div className="bg-brand-secondary rounded-lg transition-colors hover:bg-gray-800/50">
      <StyledLink href={postUrl} className="flex items-center gap-4 p-4 group">
        <div className="flex-shrink-0 w-24 h-16 relative">
          <Image
            src={post.featuredImage || placeholderImage}
            alt={post.title}
            layout="fill"
            objectFit="cover"
            className="rounded-md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white leading-tight text-base md:text-lg line-clamp-2 mb-2 group-hover:text-brand-purple transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center gap-4 text-xs text-brand-muted">
            <div className="flex items-center gap-1.5">
              <User size={12} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </div>
        </div>
      </StyledLink>
    </div>
  );
}
