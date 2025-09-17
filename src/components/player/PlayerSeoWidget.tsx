// ===== src/components/player/PlayerSeoWidget.tsx =====
import { getI18n } from "@/lib/i18n/server";
import { BookOpenText } from "lucide-react";

interface PlayerSeoWidgetProps {
  locale: string;
  playerName: string;
}

export default async function PlayerSeoWidget({
  locale,
  playerName,
}: PlayerSeoWidgetProps) {
  const t = await getI18n(locale);

  // Fetch the SEO text and title from your translation files
  // The 'playerName' is passed as a parameter to the t function
  const seoTitle = t("player_seo_widget_title", { playerName });
  const seoText = t("player_seo_widget_text", { playerName });

  // Don't render the widget if there's no text to show
  if (!seoText || seoText === `player_seo_widget_text`) {
    return null;
  }

  return (
    <section className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <BookOpenText size={18} className="text-[var(--brand-accent)]" />
        {seoTitle}
      </h3>
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: seoText }}
      />
    </section>
  );
}
