// src/components/SidebarNewsItem.tsx
"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { IPost } from "@/models/Post";
import { ChevronRight } from "lucide-react";

interface SidebarNewsItemProps {
  post: IPost;
}

// Skeleton for the new, compact list item
export const SidebarNewsItemSkeleton = () => (
  <div className="flex flex-col gap-1.5 p-2 animate-pulse">
    <div className="h-4 w-full rounded bg-gray-700"></div>
    <div className="h-3 w-1/3 rounded bg-gray-700"></div>
  </div>
);

export default function SidebarNewsItem({ post }: SidebarNewsItemProps) {
  const postUrl = `/football/news/${post.slug}`;

  return (
    <Link
      href={postUrl}
      className="block p-3 rounded-lg group hover:bg-[var(--color-primary)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-text-primary leading-snug group-hover:text-[var(--brand-accent)] transition-colors line-clamp-2">
            {post.title}
          </h4>
          <p className="text-xs text-text-muted mt-1.5">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5 group-hover:text-[var(--brand-accent)] transition-colors" />
      </div>
    </Link>
  );
}
