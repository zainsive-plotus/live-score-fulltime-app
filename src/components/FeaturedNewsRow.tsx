// ===== src/components/FeaturedNewsRow.tsx =====

// REMOVED: "use client";
import Image from "next/image";
import Link from "next/link";
import { IPost } from "@/models/Post";
import { format } from "date-fns";
import { ArrowUpRight, Calendar, User } from "lucide-react";
// REMOVED: import { useTranslation } from "@/hooks/useTranslation";

interface FeaturedNewsRowProps {
  post: IPost;
  tFeaturedArticle: string; // ADDED: Prop for translated "Featured Article"
  tReadMore: string; // ADDED: Prop for translated "Read More"
}

export function FeaturedNewsRowSkeleton() {
  return (
    <div className="bg-brand-secondary rounded-lg flex flex-col sm:flex-row gap-0 animate-pulse mb-8">
      <div className="w-full sm:w-2/5 h-64 sm:h-auto bg-gray-700 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none flex-shrink-0"></div>
      <div className="w-full p-8 space-y-4">
        <div className="h-4 w-1/3 bg-gray-600 rounded"></div>
        <div className="h-8 w-full bg-gray-600 rounded"></div>
        <div className="h-8 w-4/5 bg-gray-600 rounded"></div>
        <div className="h-4 w-full bg-gray-600 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-600 rounded"></div>
      </div>
    </div>
  );
}

// MODIFIED: Function signature to accept new props
export default function FeaturedNewsRow({
  post,
  tFeaturedArticle,
  tReadMore,
}: FeaturedNewsRowProps) {
  // REMOVED: const { t } = useTranslation();
  if (!post) return null;

  const postUrl = `/news/${post.slug}`;

  return (
    <div className="bg-brand-secondary rounded-lg flex flex-col sm:flex-row items-center transition-shadow hover:shadow-2xl hover:shadow-brand-purple/10 mb-8">
      {/* Image Section */}
      <Link
        href={postUrl}
        className="block w-full sm:w-2/5 flex-shrink-0 h-64 sm:h-80"
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
      </Link>

      {/* Content Section */}
      <div className="p-6 md:p-8 flex flex-col flex-1 min-w-0">
        <p className="text-sm text-brand-purple font-bold mb-2">
          {tFeaturedArticle} {/* MODIFIED: Use prop */}
        </p>
        <h2 className="font-bold text-white leading-tight mb-3 text-2xl md:text-3xl">
          <Link href={postUrl} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        {post.metaDescription && (
          <p className="text-brand-light text-base flex-grow mb-4 line-clamp-3">
            {post.metaDescription}
          </p>
        )}
        <div className="mt-auto">
          <Link
            href={postUrl}
            className="text-brand-purple font-semibold text-sm flex items-center gap-1"
          >
            {tReadMore} <ArrowUpRight size={16} /> {/* MODIFIED: Use prop */}
          </Link>
        </div>
      </div>
    </div>
  );
}
