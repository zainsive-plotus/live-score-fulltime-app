// ===== src/components/match/MatchAboutWidget.tsx =====

"use client";

import { Info } from "lucide-react";

interface MatchAboutWidgetProps {
  title: string;
  seoText: string;
}

export default function MatchAboutWidget({
  title,
  seoText,
}: MatchAboutWidgetProps) {
  if (!seoText) return null;

  return (
    <div className="bg-brand-secondary rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Info size={26} className="text-[var(--brand-accent)]" />
        {title}
      </h3>
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: seoText }}
      />
    </div>
  );
}
