// ===== src/components/league-detail-view/LeagueSeoWidget.tsx =====

import { BookOpenText } from "lucide-react";
import "server-only";

interface LeagueSeoWidgetProps {
  title: string;
  seoText: string;
}

export default function LeagueSeoWidget({
  title,
  seoText,
}: LeagueSeoWidgetProps) {
  if (!seoText) {
    return null;
  }

  return (
    <section className="bg-brand-secondary p-6 rounded-lg shadow-xl mt-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <BookOpenText size={22} className="text-[var(--brand-accent)]" />
        {title}
      </h2>
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: seoText }}
      />
    </section>
  );
}
