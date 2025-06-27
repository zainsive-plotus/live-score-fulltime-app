// src/components/DirectoryCard.tsx
import Image from "next/image";
import StyledLink from "./StyledLink";
import { League } from "@/types/api-football";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Star } from "lucide-react"; // Import an icon for a badge

// The skeleton remains unchanged.
export const DirectoryCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 flex items-center gap-4 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
    <div className="space-y-2 flex-1">
      <div className="h-4 w-3/4 rounded bg-gray-600"></div>
      <div className="h-3 w-1/2 rounded bg-gray-600"></div>
    </div>
  </div>
);

// Add isPopular to the props interface
interface DirectoryCardProps extends League {
  isPopular?: boolean;
}

export default function DirectoryCard({
  id,
  name,
  logoUrl,
  countryName,
  href,
  isPopular,
}: DirectoryCardProps) {
  // Determine conditional classes based on the isPopular prop
  const containerClasses = isPopular
    ? "border-l-4 border-brand-purple"
    : "border-l-4 border-transparent";

  return (
    <StyledLink href={href} className="block group h-full">
      {/* Apply the conditional border class */}
      <div
        className={`bg-brand-secondary rounded-lg flex items-center gap-4 p-4 h-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20 ${containerClasses}`}
      >
        <Image
          src={proxyImageUrl(logoUrl)}
          alt={`${name} logo`}
          width={40}
          height={40}
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate group-hover:text-brand-purple transition-colors">
            {name}
          </h3>
          <p className="text-sm text-brand-muted">{countryName}</p>
        </div>
        {/* Add a subtle star icon badge for popular leagues */}
        {isPopular && (
          <div className="flex-shrink-0" title="Popular Competition">
            <Star className="w-5 h-5 text-yellow-500/80" />
          </div>
        )}
      </div>
    </StyledLink>
  );
}
