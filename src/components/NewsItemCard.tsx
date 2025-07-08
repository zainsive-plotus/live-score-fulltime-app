import Image from "next/image";
import Link from "@/components/StyledLink";

// --- 1. Define the TypeScript interface for a single news article ---
export interface NewsArticleType {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  articleUrl: string; // The URL the card will link to
}

interface NewsItemCardProps {
  article: NewsArticleType;
}

// --- 2. The NewsItemCard Component ---
export default function NewsItemCard({ article }: NewsItemCardProps) {
  return (
    // The entire card is a clickable link for better UX
    <Link
      href={article.articleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="bg-brand-secondary rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20">
        {/* Image Container with hover effect */}
        <div className="relative w-full h-40">
          <Image
            src={article.imageUrl}
            alt={article.title}
            layout="fill"
            unoptimized={true}
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Text Content */}
        <div className="p-4">
          <h4 className="font-bold text-lg text-brand-light mb-2 leading-tight group-hover:text-brand-purple transition-colors">
            {article.title}
          </h4>
          <p className="text-sm text-brand-muted line-clamp-3">
            {article.excerpt}
          </p>
        </div>
      </div>
    </Link>
  );
}

// --- 3. Skeleton Component (can be in this file or its own) ---
export const NewsItemCardSkeleton = () => {
  return (
    <div className="bg-brand-secondary rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-40 bg-gray-600/50"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 w-full rounded bg-gray-600/50"></div>
        <div className="h-5 w-4/5 rounded bg-gray-600/50"></div>
        <div className="h-3 w-full rounded bg-gray-600/50 mt-2"></div>
        <div className="h-3 w-1/2 rounded bg-gray-600/50"></div>
      </div>
    </div>
  );
};
