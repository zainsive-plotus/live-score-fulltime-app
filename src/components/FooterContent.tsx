// ===== src/components/FooterContent.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { IPost } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-sm text-brand-muted hover:text-white transition-colors"
  >
    {children}
  </Link>
);

const FooterColumn = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <h4 className="font-bold text-white uppercase tracking-wider">{title}</h4>
    <div className="flex flex-col space-y-3">{children}</div>
  </div>
);

const fetchRecentPosts = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/posts?status=published&limit=5");
  return data.posts; // API returns { posts: [...] }
};

const fetchRecentFootballScores = async () => {
  // This is mock data, so it's very fast, but we keep it here for consistency
  return [
    { id: 1, home: "RB Salzburg", away: "Real Madrid", href: "#" },
    { id: 2, home: "Juventus", away: "Man City", href: "#" },
    { id: 3, home: "Man City", away: "Al-Ain", href: "#" },
    { id: 4, home: "Benfica", away: "Chelsea", href: "#" },
    { id: 5, home: "Espérance", away: "Chelsea", href: "#" },
  ];
};

export default function FooterContent() {
  const { t } = useTranslation();

  const { data: recentPosts } = useQuery({
    queryKey: ["recentPostsFooter"],
    queryFn: fetchRecentPosts,
    staleTime: 1000 * 60 * 10,
  });

  const { data: footballScores } = useQuery({
    queryKey: ["recentScoresFooter"],
    queryFn: fetchRecentFootballScores,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      <div className="space-y-8">
        <div>
          <p className="font-bold text-white uppercase tracking-wider mb-4">
            {t("footer_about_title")}
          </p>
          <p className="text-sm text-brand-muted leading-relaxed">
            {t("footer_about_text")}
          </p>
        </div>
        <div>
          <p className="font-bold text-white uppercase tracking-wider mb-4">
            {t("news")}
          </p>
          <div className="text-sm text-brand-muted space-y-2">
            {recentPosts?.map((post) => (
              <Link
                key={post._id as string}
                href={`/news/${post.slug}`} // Note: This should ideally include locale
                className="block truncate hover:text-white transition-colors"
              >
                {post.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div>
        <FooterColumn title={t("football")}>
          <FooterLink href="/football/league/premier-league-39">
            Premier League
          </FooterLink>
          <FooterLink href="/football/league/la-liga-140">LaLiga</FooterLink>
          <FooterLink href="/football/league/serie-a-135">Serie A</FooterLink>
          <FooterLink href="/football/league/bundesliga-78">
            Bundesliga
          </FooterLink>
          <FooterLink href="/football/league/ligue-1-61">Ligue 1</FooterLink>
          <FooterLink href="/football/league/uefa-champions-league-2">
            UEFA Champions League
          </FooterLink>
        </FooterColumn>
      </div>

      <div>
        <FooterColumn title={t("footer_football_scores_title")}>
          {footballScores?.map((score) => (
            <FooterLink key={score.id} href={score.href}>
              {score.home} - {score.away}
            </FooterLink>
          ))}
        </FooterColumn>
      </div>

      <div>
        <FooterColumn title={t("footer_information_title")}>
          <FooterLink href="/contact-us">{t("contact_us")}</FooterLink>
          <FooterLink href="/faq">{t("faq_title")}</FooterLink>
          <FooterLink href="/author">{t("author_title")}</FooterLink>
          <FooterLink href="/report-abuse">
            {t("report_abuse_title")}
          </FooterLink>
          <FooterLink href="/privacy-policy">
            {t("privacy_policy_title")}
          </FooterLink>
          <FooterLink href="/terms-and-conditions">
            {t("terms_and_conditions_title")}
          </FooterLink>
        </FooterColumn>
      </div>
    </div>
  );
}
