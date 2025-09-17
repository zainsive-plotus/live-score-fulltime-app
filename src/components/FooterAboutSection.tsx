import { getI18n } from "@/lib/i18n/server";
import { BookOpenText } from "lucide-react";

export default async function FooterAboutSection({
  locale,
}: {
  locale: string;
}) {
  const t = await getI18n(locale);
  const aboutTitle = t("footer_about_title");
  const aboutText = t("footer_about_text");

  // Split text by double newlines to create paragraphs for better formatting
  const paragraphs = aboutText.split("\\n\\n").filter((p) => p.trim() !== "");

  return (
    <div className="border-b border-gray-700/50">
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <BookOpenText size={24} className="text-[var(--brand-accent)]" />
          {aboutTitle}
        </h2>
        <div className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
          {paragraphs.map((p, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: p }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
