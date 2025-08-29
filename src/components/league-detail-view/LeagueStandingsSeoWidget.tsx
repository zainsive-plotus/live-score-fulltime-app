import { getI18n } from "@/lib/i18n/server";
import { BookOpenText } from "lucide-react";
import dbConnect from "@/lib/dbConnect";
import SeoContent from "@/models/SeoContent"; // ** NEW: Use the generic SeoContent model **

interface LeagueStandingsSeoWidgetProps {
  locale: string;
  leagueId: number;
  leagueName: string;
  season: number;
}

export default async function LeagueStandingsSeoWidget({
  locale,
  leagueId,
  leagueName,
  season,
}: LeagueStandingsSeoWidgetProps) {
  const t = await getI18n(locale);

  await dbConnect();
  // ** THE FIX IS HERE: Fetch the pre-generated content for this specific league and language **
  const seoContentDoc = await SeoContent.findOne({
    pageType: "league-standings",
    entityId: leagueId.toString(),
    language: locale,
  }).lean();

  // If no specific content exists for this league, render nothing.
  if (!seoContentDoc || !seoContentDoc.seoText) {
    return null;
  }

  return (
    <section className="bg-brand-secondary p-6 rounded-lg shadow-xl mt-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <BookOpenText size={22} className="text-[var(--brand-accent)]" />
        {/* Use a generic title, which can be translated */}
        {t("about_league_name", { leagueName: leagueName, season })}
      </h2>
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
        // Render the fetched HTML directly
        dangerouslySetInnerHTML={{ __html: seoContentDoc.seoText }}
      />
    </section>
  );
}
