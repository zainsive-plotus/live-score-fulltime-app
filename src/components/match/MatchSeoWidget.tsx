// ===== src/components/match/MatchSeoWidget.tsx =====

import { BookOpenText } from "lucide-react";
import "server-only"; // Mark this as a server-only component

interface MatchSeoWidgetProps {
  title: string;
  seoText: string;
}

export default function MatchSeoWidget({
  title,
  seoText,
}: MatchSeoWidgetProps) {
  if (!seoText) {
    return null;
  }

  return (
    <div className="bg-brand-secondary rounded-lg p-4 md:p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <BookOpenText size={22} className="text-[var(--brand-accent)]" />
        {title}
      </h2>
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: seoText }}
      />
    </div>
  );
}
