// src/components/NewsListItem.tsx
"use client";

import Image from "next/image";
import StyledLink from "./StyledLink";
import { IPost } from "@/models/Post";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";

export function NewsListItemSkeleton() {
  return (
    <div className="bg-brand-secondary rounded-lg flex flex-col sm:flex-row gap-0 animate-pulse">
      <div className="w-full sm:w-48 md:w-56 h-40 sm:h-auto bg-gray-700 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none flex-shrink-0"></div>
      <div className="w-full p-6 space-y-3">
        <div className="h-4 w-1/4 bg-gray-600 rounded"></div>
        <div className="h-6 w-full bg-gray-600 rounded"></div>
        <div className="h-4 w-3/4 bg-gray-600 rounded"></div>
      </div>
    </div>
  );
}

interface NewsListItemProps {
  post: IPost;
}

export default function NewsListItem({ post }: NewsListItemProps) {
  const postUrl = `/football/news/${post.slug}`;

  return (
    // --- FIX 1: The flex parent ---
    // The main container is a flexbox. We set items-center to vertically align content.
    <div className="bg-brand-secondary rounded-lg group flex flex-col sm:flex-row items-center transition-colors hover:bg-gray-800/50">
      {/* --- Image Container --- */}
      {/* It has a fixed width and shrinks to 0 height on small screens, letting aspect-video take over. */}
      <StyledLink
        href={postUrl}
        className="block w-full sm:w-48 md:w-56 flex-shrink-0 h-40 sm:h-auto sm:self-stretch"
      >
        <div className="relative w-full h-full">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAltText || post.title}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none">
              <span className="text-brand-muted">No Image</span>
            </div>
          )}
        </div>
      </StyledLink>

      {/* --- FIX 2: The Text Content Container --- */}
      {/* `min-w-0` is the key fix. It allows this flex item to shrink and its text content to wrap properly. */}
      {/* `flex-1` ensures it takes up the remaining available space. */}
      <div className="p-6 flex flex-col flex-1 min-w-0">
        <p className="text-sm text-brand-muted mb-2">
          {format(new Date(post.createdAt), "MMMM dd, yyyy")}
        </p>
        <h3 className="font-bold text-white leading-tight mb-3 text-lg">
          <StyledLink
            href={postUrl}
            className="hover:text-brand-purple transition-colors"
          >
            {post.title}
          </StyledLink>
        </h3>
        {post.metaDescription && (
          <p className="text-brand-light text-sm flex-grow mb-4 line-clamp-2">
            {post.metaDescription}
          </p>
        )}
        <div className="mt-auto">
          <StyledLink
            href={postUrl}
            className="text-brand-purple font-semibold text-sm flex items-center gap-1"
          >
            Read More <ArrowUpRight size={16} />
          </StyledLink>
        </div>
      </div>
    </div>
  );
}
