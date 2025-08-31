// ===== src/components/team/TeamSeoWidget.tsx =====

import { BookOpen } from "lucide-react";

interface TeamSeoWidgetProps {
  title: string;
  seoText: string;
}

// REMOVED: The old paragraph formatting function is no longer needed.

export default function TeamSeoWidget({ title, seoText }: TeamSeoWidgetProps) {
  if (!seoText) return null;

  return (
    <div className="bg-brand-secondary rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <BookOpen size={18} className="text-[var(--brand-accent)]" />
        {title}
      </h3>
      {/* MODIFIED: This now uses dangerouslySetInnerHTML to render the fetched HTML directly */}
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: seoText }}
      />
    </div>
  );
}
