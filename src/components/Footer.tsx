// src/components/Footer.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { IPost } from "@/models/Post";

// --- Reusable Sub-components for clean code ---
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

// --- Fetchers for Dynamic Content ---
const fetchRecentPosts = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/posts?status=published&limit=5");
  return data;
};

// Placeholder for fetching recent scores
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
    <footer className="bg-brand-secondary text-white py-12">
      <div className="container mx-auto px-4">
        {/* --- TOP SECTION: 4-column grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: About & News */}
          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-4">
                About
              </h4>
              <p className="text-sm text-brand-muted leading-relaxed">
                Live football scores from more than 500 worldwide leagues, cups,
                and tournaments.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-4">
                News
              </h4>
              <div className="text-sm text-brand-muted space-y-2">
                {recentPosts?.map((post) => (
                  <Link
                    key={post._id}
                    href={`/football/news/${post.slug}`}
                    className="block truncate hover:text-white transition-colors"
                  >
                    {post.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Football Leagues */}
          <div className="space-y-8">
            <FooterColumn title="Football">
              <FooterLink href="#">Premier League</FooterLink>
              <FooterLink href="#">LaLiga</FooterLink>
              <FooterLink href="#">Serie A</FooterLink>
              <FooterLink href="#">Bundesliga</FooterLink>
              <FooterLink href="#">Ligue 1</FooterLink>
              <FooterLink href="#">UEFA Champions League</FooterLink>
            </FooterColumn>
          </div>

          {/* Column 3: Football Scores */}
          <div>
            <FooterColumn title="Football Scores">
              {footballScores?.map((score) => (
                <FooterLink key={score.id} href={score.href}>
                  {score.home} - {score.away}
                </FooterLink>
              ))}
            </FooterColumn>
          </div>

          {/* Column 4: Company & Legal Links */}
          <div>
            <FooterColumn title="Information">
              <FooterLink href="/contact-us">Contact us</FooterLink>
              <FooterLink href="/faq">Frequently Ask Question</FooterLink>
              <FooterLink href="/author">Author</FooterLink>
              <FooterLink href="/report-abuse">Report Abuse</FooterLink>
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/terms-and-conditions">
                Terms & Conditions
              </FooterLink>
            </FooterColumn>
          </div>
        </div>

        {/* --- MODIFIED MIDDLE SECTION: Credibility and Responsible Gaming Logos --- */}
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
            <Link href="/responsible-gaming" title="Responsible Gaming">
              <Image
                src="/images/logos/18plus.svg"
                alt="18+ Responsible Gaming"
                width={40}
                height={40}
              />
            </Link>
            <Link href="/about-us#credibility" title="Verified by GamCare">
              <Image
                src="/images/logos/gamcare.svg"
                alt="GamCare Verified"
                width={110}
                height={35}
              />
            </Link>
            <Link href="/responsible-gaming#gambleaware" title="BeGambleAware">
              <Image
                src="/images/logos/begambleaware.svg"
                alt="BeGambleAware"
                width={190}
                height={25}
              />
            </Link>
            <Link href="/about-us#security" title="Secure Connection">
              <Image
                src="/images/logos/dmca-protected.svg"
                alt="DMCA Protected"
                width={180}
                height={35}
              />
            </Link>
          </div>
        </div>

        {/* --- BOTTOM SECTION: Copyright and Legal Links --- */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-brand-muted">
          <p className="mb-4 md:mb-0">
            © {new Date().getFullYear()} Fanskor - All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
            <FooterLink href="/terms-and-conditions">
              Terms & Conditions
            </FooterLink>
            <FooterLink href="/gdpr">GDPR & Journalism</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
