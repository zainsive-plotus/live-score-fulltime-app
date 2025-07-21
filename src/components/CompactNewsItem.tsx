"use client";

import Image from "next/image";
import Link from "next/link";
import { IPost } from "@/models/Post";
import { formatDistanceToNow } from "date-fns";
import { Calendar, User } from "lucide-react";

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

  // ===== THIS IS THE FIX =====
  // Create a locale-prefixed path manually, because this component does not use StyledLink.
  // We use the language property from the post object itself to ensure correctness.
  const postUrl = `/${post.language}/news/${post.slug}`;
  // ==========================

  const placeholderImage = "/images/placeholder-logo.svg";

  return (
    <div className="bg-brand-secondary rounded-lg transition-colors hover:bg-gray-800/50">
      <Link href={postUrl} className="flex items-center gap-4 p-4 group">
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
      </Link>
    </div>
  );
}
