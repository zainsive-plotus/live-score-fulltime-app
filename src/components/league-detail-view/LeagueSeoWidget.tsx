// ===== src/components/league-detail-view/LeagueStandingsSeoWidget.tsx =====

import { getI18n } from "@/lib/i18n/server";
import { BookOpenText } from "lucide-react";

interface LeagueStandingsSeoWidgetProps {
  locale: string;
  leagueId: number;
  leagueName: string;
  season: number;
  seoText: string; // MODIFIED: Accept the seoText as a prop
}

export default async function LeagueStandingsSeoWidget({
  locale,
  leagueId,
  leagueName,
  season,
  seoText, // MODIFIED: Destructure the new prop
}: LeagueStandingsSeoWidgetProps) {
  const t = await getI18n(locale);

  if (!seoText) {
    return null;
  }

  const title = t("about_league_name", { leagueName: leagueName, season });

  return (
    <section className="bg-brand-secondary p-6 rounded-lg shadow-xl mt-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <BookOpenText size={22} className="text-[var(--brand-accent)]" />
        {title}
      </h2>
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
        // MODIFIED: Render the seoText from the prop
        dangerouslySetInnerHTML={{ __html: seoText }}
      />
    </section>
  );
}
