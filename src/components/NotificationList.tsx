// ===== src/components/NotificationList.tsx =====
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import NotificationItem from "./NotificationItem";
import { BellOff } from "lucide-react";

const Skeleton = () => (
  <div className="flex items-start gap-4 p-3 animate-pulse">
    <div className="w-12 h-12 bg-gray-700 rounded-md"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 w-full bg-gray-700 rounded"></div>
      <div className="h-3 w-1/3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

interface NotificationListProps {
  onItemClick?: () => void;
}

const fetchLatestPosts = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/posts?status=published&limit=5");
  return data;
};

export default function NotificationList({
  onItemClick,
}: NotificationListProps) {
  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["latestPostsForNotifications"],
    queryFn: fetchLatestPosts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !posts || posts.length === 0) {
    return (
      <div className="text-center py-10 text-brand-muted">
        <BellOff size={32} className="mx-auto mb-3" />
        <p className="text-sm">No new notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {posts.map((post) => (
        <NotificationItem
          key={post._id}
          post={post}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}
