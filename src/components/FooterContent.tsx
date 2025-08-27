import StyledLink from "./StyledLink"; // ** FIX: Import StyledLink instead of next/link **
import { getI18n } from "@/lib/i18n/server";

// ** FIX: Use StyledLink to handle locale prefixes automatically **
const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <StyledLink
    href={href}
    className="text-sm text-brand-muted hover:text-white transition-colors"
  >
    {children}
  </StyledLink>
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

const fetchRecentFootballScores = async () => {
  return [
    { id: 1, home: "RB Salzburg", away: "Real Madrid", href: "#" },
    { id: 2, home: "Juventus", away: "Man City", href: "#" },
    { id: 3, home: "Man City", away: "Al-Ain", href: "#" },
    { id: 4, home: "Benfica", away: "Chelsea", href: "#" },
    { id: 5, home: "Espérance", away: "Chelsea", href: "#" },
  ];
};

export default async function FooterContent({ locale }: { locale: string }) {
  const t = await getI18n(locale);
  const footballScores = await fetchRecentFootballScores();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 py-12">
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

      <FooterColumn title={t("footer_football_scores_title")}>
        {footballScores?.map((score) => (
          <FooterLink key={score.id} href={score.href}>
            {score.home} - {score.away}
          </FooterLink>
        ))}
      </FooterColumn>

      <FooterColumn title={t("footer_information_title")}>
        <FooterLink href="/contact-us">{t("contact_us")}</FooterLink>
        <FooterLink href="/faq">{t("faq_title")}</FooterLink>
        <FooterLink href="/author">{t("author_title")}</FooterLink>
        <FooterLink href="/report-abuse">{t("report_abuse_title")}</FooterLink>
        <FooterLink href="/privacy-policy">
          {t("privacy_policy_title")}
        </FooterLink>
        <FooterLink href="/terms-and-conditions">
          {t("terms_and_conditions_title")}
        </FooterLink>
      </FooterColumn>

      <div className="sm:col-span-2 lg:col-span-1">
        <div className="space-y-4">
          <h4 className="font-bold text-white uppercase tracking-wider">
            FanSkor
          </h4>
          <div className="flex flex-col space-y-3">
            <FooterLink href="/">{t("homepage")}</FooterLink>
            <FooterLink href="/highlights">{t("highlights")}</FooterLink>
            <FooterLink href="/predictions">{t("predictions")}</FooterLink>
            <FooterLink href="/news">{t("news")}</FooterLink>
          </div>
        </div>
      </div>
    </div>
  );
}
