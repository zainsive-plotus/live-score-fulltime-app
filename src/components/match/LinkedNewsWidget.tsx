// ===== src/components/match/LinkedNewsWidget.tsx =====
"use client";

import { IPost } from "@/models/Post";
import { Newspaper } from "lucide-react";
import SidebarNewsItem from "../SidebarNewsItem";
import { useTranslation } from "@/hooks/useTranslation";

// The widget now accepts posts as a prop
interface LinkedNewsWidgetProps {
  posts: IPost[];
}

export default function LinkedNewsWidget({ posts }: LinkedNewsWidgetProps) {
  const { t } = useTranslation();

  // If there are no posts, don't render anything.
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-[var(--brand-accent)]" />
          {t("related_news")}
        </h2>
      </div>

      <div className="p-2 space-y-1">
        {posts.map((post) => (
          <SidebarNewsItem
            key={post._id as string}
            post={{
              ...post,
              slug: `/${post.language}/news/${post.slug}`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
