// ===== src/components/admin/SeoAnalysis.tsx =====

"use client";

import { memo } from "react";
import { SeoAnalysisResult } from "@/lib/seo-analyzer";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface SeoAnalysisProps {
  result: SeoAnalysisResult;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
};

const AnalysisItem = ({
  text,
  type,
}: {
  text: string;
  type: "good" | "improvements" | "errors";
}) => {
  const Icon =
    type === "good"
      ? CheckCircle
      : type === "improvements"
      ? AlertTriangle
      : XCircle;
  const color =
    type === "good"
      ? "text-green-400"
      : type === "improvements"
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon size={16} className={`${color} flex-shrink-0 mt-0.5`} />
      <span className="text-brand-light">{text}</span>
    </li>
  );
};

const SeoAnalysis = memo(function SeoAnalysis({ result }: SeoAnalysisProps) {
  if (!result) {
    return null;
  }

  return (
    <div className="p-4 bg-brand-dark rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">On-Page SEO Analysis</h3>
        <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
          {result.score} <span className="text-base">/ 100</span>
        </div>
      </div>

      <div className="space-y-4">
        {result.analysis.errors.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase text-red-400 mb-2">
              Errors
            </h4>
            <ul className="space-y-1.5">
              {result.analysis.errors.map((item) => (
                <AnalysisItem key={item} text={item} type="errors" />
              ))}
            </ul>
          </div>
        )}
        {result.analysis.improvements.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase text-yellow-400 mb-2">
              Improvements
            </h4>
            <ul className="space-y-1.5">
              {result.analysis.improvements.map((item) => (
                <AnalysisItem key={item} text={item} type="improvements" />
              ))}
            </ul>
          </div>
        )}
        {result.analysis.good.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase text-green-400 mb-2">
              Good Results
            </h4>
            <ul className="space-y-1.5">
              {result.analysis.good.map((item) => (
                <AnalysisItem key={item} text={item} type="good" />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

export default SeoAnalysis;
