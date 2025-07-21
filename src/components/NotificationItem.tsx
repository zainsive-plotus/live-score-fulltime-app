"use client";

import { IPost } from "@/models/Post";
import Link from "next/link"; // <-- Using NextLink directly is fine here
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { proxyImageUrl } from "@/lib/image-proxy";

interface NotificationItemProps {
  post: IPost;
  onItemClick?: () => void;
}

export default function NotificationItem({
  post,
  onItemClick,
}: NotificationItemProps) {
  // ===== THIS IS THE FIX =====
  // Create a locale-prefixed path manually because StyledLink is not used.
  // We use the language property from the post object itself.
  const postUrl = `/${post.language}/news/${post.slug}`;
  // ==========================

  const placeholderImage = "/images/placeholder-logo.svg";

  return (
    <Link
      href={postUrl}
      onClick={onItemClick}
      className="flex items-start gap-3 p-2 rounded-lg hover:bg-brand-purple/20 transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 relative">
        <Image
          src={proxyImageUrl(post.featuredImage || placeholderImage)}
          alt={post.title}
          layout="fill"
          objectFit="cover"
          className="rounded-md"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white line-clamp-2">
          {post.title}
        </p>
        <p className="text-xs text-brand-muted mt-0.5">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
}
