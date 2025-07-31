// ===== src/components/Footer.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
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

// --- Start of Fix ---
// This function now expects the structured response from the API
const fetchRecentPosts = async (): Promise<{ posts: IPost[] }> => {
  const { data } = await axios.get("/api/posts?status=published&limit=5");
  return data;
};
// --- End of Fix ---

const fetchRecentFootballScores = async () => {
  return [
    { id: 1, home: "RB Salzburg", away: "Real Madrid", href: "#" },
    { id: 2, home: "Juventus", away: "Man City", href: "#" },
    { id: 3, home: "Man City", away: "Al-Ain", href: "#" },
    { id: 4, home: "Benfica", away: "Chelsea", href: "#" },
    { id: 5, home: "Espérance", away: "Chelsea", href: "#" },
  ];
};

export default function Footer() {
  const { t } = useTranslation();

  // --- Start of Fix ---
  // The `useQuery` hook now uses the `select` option to transform the data,
  // ensuring that the `recentPosts` variable is the array we need.
  const { data: recentPosts } = useQuery({
    queryKey: ["recentPostsFooter"],
    queryFn: fetchRecentPosts,
    staleTime: 1000 * 60 * 10,
    select: (data) => data.posts, // Extract the 'posts' array from the API response
  });
  // --- End of Fix ---

  const { data: footballScores } = useQuery({
    queryKey: ["recentScoresFooter"],
    queryFn: fetchRecentFootballScores,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <footer className="bg-brand-secondary text-white py-12">
      <div className="container mx-auto px-4">
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
                    href={`/football/news/${post.slug}`} // Assuming these are football news for now
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
              <FooterLink href="https://fanskor.com/football/league/premier-league-39">
                Premier League
              </FooterLink>
              <FooterLink href="https://fanskor.com/football/league/la-liga-140">
                LaLiga
              </FooterLink>
              <FooterLink href="https://fanskor.com/football/league/serie-a-135">
                Serie A
              </FooterLink>
              <FooterLink href="https://fanskor.com/football/league/bundesliga-78">
                Bundesliga
              </FooterLink>
              <FooterLink href="https://fanskor.com/football/league/ligue-1-61">
                Ligue 1
              </FooterLink>
              <FooterLink href="https://fanskor.com/football/league/uefa-champions-league-2">
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

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-700/50 pt-8 mb-8">
          <div className="mb-6 md:mb-0">
            <Image
              src="/fanskor-transparent.webp"
              alt="Fanskor logo"
              width={280}
              height={40}
            />
          </div>
          <div className="flex items-center gap-6 md:gap-8">
            <Image
              src="/images/logos/18plus.svg"
              alt="18+ Responsible Gaming"
              width={40}
              height={40}
            />
            <Image
              src="/images/logos/gamcare.svg"
              alt="GamCare Verified"
              width={110}
              height={35}
            />
            <Image
              src="/images/logos/begambleaware.svg"
              alt="BeGambleAware"
              width={190}
              height={25}
            />
            <Image
              src="/images/logos/dmca-protected.svg"
              alt="DMCA Protected"
              width={180}
              height={35}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-brand-muted">
          <p className="mb-4 md:mb-0">
            © {new Date().getFullYear()} Fanskor - {t("footer_rights_reserved")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <FooterLink href="/privacy-policy">
              {t("privacy_policy_title")}
            </FooterLink>
            <FooterLink href="/terms-and-conditions">
              {t("terms_and_conditions_title")}
            </FooterLink>
            <FooterLink href="/gdpr">{t("gdpr_title")}</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
