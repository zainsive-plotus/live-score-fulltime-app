// ===== src/components/admin/SERPPreview.tsx =====

"use client";

import { memo } from "react";
import { IPost } from "@/models/Post";

interface SERPPreviewProps {
  post: Partial<IPost>;
  siteUrl: string;
}

const SERPPreview = memo(function SERPPreview({
  post,
  siteUrl,
}: SERPPreviewProps) {
  const metaTitle = post.metaTitle || post.title || "Your Post Title";
  const metaDescription =
    post.metaDescription ||
    "This is a preview of your meta description. Write something compelling!";
  const slug = post.slug || "your-post-slug";
  const language = post.language || "en";

  // Construct the display URL
  const displayUrl = `${siteUrl}/${language}/news › ${slug}`;

  return (
    <div className="p-4 bg-brand-dark rounded-lg border border-gray-700">
      <h3 className="font-semibold text-white mb-2">SERP Preview</h3>
      <div className="font-sans">
        <p className="text-sm text-gray-300 truncate">{displayUrl}</p>
        <h4 className="text-xl text-blue-400 font-medium truncate hover:underline cursor-pointer">
          {metaTitle}
        </h4>
        <p className="text-sm text-gray-400 line-clamp-2">{metaDescription}</p>
      </div>
    </div>
  );
});

export default SERPPreview;
