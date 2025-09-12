// ===== src/components/league-detail-view/LeagueNewsTab.tsx =====

"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { IPost } from "@/models/Post";
import NewsListItemCompact from "@/components/NewsListItemCompact";
import { Info } from "lucide-react";
import StyledLink from "../StyledLink";

interface LeagueNewsTabProps {
  news: IPost[] | null;
  leagueName: string;
}

export default function LeagueNewsTab({
  news,
  leagueName,
}: LeagueNewsTabProps) {
  const { t } = useTranslation();

  if (!news) {
    return (
      <div className="p-8 text-center text-red-400 bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("error_loading_news")}</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="p-8 text-center text-brand-muted bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">
          {t("no_news_found_for_league", { leagueName })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {news.map((post) => (
        <NewsListItemCompact key={post._id as string} post={post} />
      ))}
      <div className="pt-4 text-center">
        <StyledLink
          href="/news"
          className="text-sm font-semibold text-brand-purple hover:underline"
        >
          {t("view_all_news")}
        </StyledLink>
      </div>
    </div>
  );
}

// Add these new translation keys:
// "no_news_found_for_league": "No recent news found for {leagueName}.",
