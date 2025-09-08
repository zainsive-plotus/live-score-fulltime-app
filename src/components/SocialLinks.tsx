// ===== src/components/SocialLinks.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Send, // For Telegram
  MessageCircle, // For Discord
  Share2, // Default fallback icon
} from "lucide-react";
import { ISocialLink } from "@/models/SocialLink";

// This component is responsible for fetching and displaying the social links.

const platformIcons: { [key: string]: React.ElementType } = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  telegram: Send,
  discord: MessageCircle,
};

const fetchActiveSocialLinks = async (): Promise<ISocialLink[]> => {
  try {
    const { data } = await axios.get("/api/social-links");
    return data || [];
  } catch (error) {
    console.error("[SocialLinks] Failed to fetch social links:", error);
    return [];
  }
};

const Skeleton = () => (
  <div className="flex items-center gap-4 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
  </div>
);

export default function SocialLinks() {
  const {
    data: links,
    isLoading,
    isError,
  } = useQuery<ISocialLink[]>({
    queryKey: ["activeSocialLinks"],
    queryFn: fetchActiveSocialLinks,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isLoading) {
    return <Skeleton />;
  }

  if (isError || !links || links.length === 0) {
    return null; // Don't render anything if there are no links or an error occurred
  }

  return (
    <div className="flex items-center gap-4">
      {links.map((link) => {
        const Icon = platformIcons[link.platform] || Share2;
        return (
          <a
            key={link._id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow us on ${link.platform}`}
            className="text-brand-muted hover:text-white transition-colors"
          >
            <Icon size={24} />
          </a>
        );
      })}
    </div>
  );
}
