// ===== src/components/SidebarNewsItemWithImage.tsx =====

"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { IPost } from "@/models/Post";
import { proxyImageUrl } from "@/lib/image-proxy";

interface SidebarNewsItemWithImageProps {
  post: IPost;
}

export const SidebarNewsItemWithImageSkeleton = () => (
  <div className="flex items-center gap-3 p-2 animate-pulse">
    <div className="w-16 h-12 bg-gray-700 rounded-md flex-shrink-0"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 w-full bg-gray-700 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-700 rounded"></div>
      <div className="h-3 w-1/3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

export default function SidebarNewsItemWithImage({
  post,
}: SidebarNewsItemWithImageProps) {
  const postUrl = `/football/news/${post.slug}`;
  const placeholderImage = "/images/placeholder-logo.svg";

  return (
    <Link
      href={postUrl}
      className="block p-2 rounded-lg group hover:bg-brand-dark transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-16 h-12 relative">
          <Image
            src={proxyImageUrl(post.featuredImage || placeholderImage)}
            alt={post.title}
            layout="fill"
            objectFit="cover"
            className="rounded-md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-white leading-snug group-hover:text-brand-purple transition-colors line-clamp-2">
            {post.title}
          </h4>
          <p className="text-xs text-brand-muted mt-1">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
}
