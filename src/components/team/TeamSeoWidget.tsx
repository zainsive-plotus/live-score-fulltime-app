// ===== src/components/team/TeamSeoWidget.tsx =====

import { BookOpen } from "lucide-react";

interface TeamSeoWidgetProps {
  title: string;
  seoText: string;
}

// Helper to convert newline characters to JSX <p> tags on the server
const formatTextToParagraphs = (text: string) => {
  return text.split("\n\n").map((paragraph, index) => (
    <p key={index} className={index > 0 ? "mt-4" : ""}>
      {paragraph}
    </p>
  ));
};

export default function TeamSeoWidget({ title, seoText }: TeamSeoWidgetProps) {
  if (!seoText) return null;

  return (
    <div className="bg-brand-secondary rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <BookOpen size={18} className="text-[var(--brand-accent)]" />
        {title}
      </h3>
      <div className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed">
        {formatTextToParagraphs(seoText)}
      </div>
    </div>
  );
}
