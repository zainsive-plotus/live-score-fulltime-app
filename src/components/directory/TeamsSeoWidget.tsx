import { getI18n } from "@/lib/i18n/server";
import { BookOpenText } from "lucide-react";

export default async function TeamsSeoWidget({ locale }: { locale: string }) {
  const t = await getI18n(locale);
  const seoTitle = t("about_teams_title"); // You might need to add this translation key, e.g., "About Football Teams"
  const seoText = t("teams_page_seo_text");

  // Robustly split the text into paragraphs, handling escaped newlines
  const paragraphs = seoText.split("\\n\\n").filter((p) => p.trim() !== "");

  return (
    <section className="bg-brand-secondary p-6 rounded-lg shadow-xl mt-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <BookOpenText size={22} className="text-[var(--brand-accent)]" />
        {seoTitle}
      </h2>
      <div className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
        {paragraphs.map((p, index) => (
          <p key={index}>{p.trim()}</p>
        ))}
      </div>
    </section>
  );
}
