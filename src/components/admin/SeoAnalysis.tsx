// ===== src/components/admin/SeoAnalysis.tsx =====

"use client";

import { memo } from "react";
import { SeoAnalysisResult } from "@/lib/seo-analyzer";
import { CheckCircle, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";

interface SeoAnalysisProps {
  result: SeoAnalysisResult;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
};

// MODIFIED: This component now accepts and displays the optional `suggestion`
const AnalysisItem = ({
  text,
  suggestion,
  type,
}: {
  text: string;
  suggestion?: string;
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
      <div className="flex-1">
        <span className="text-brand-light">{text}</span>
        {/* ADDED: Conditionally render the suggestion text */}
        {suggestion && (
          <p className="text-xs text-brand-muted mt-0.5 italic">{suggestion}</p>
        )}
      </div>
    </li>
  );
};

const AnalysisSection = ({
  title,
  results,
  type,
}: {
  title: string;
  results: { message: string; points: number; suggestion?: string }[];
  type: "good" | "improvements" | "errors";
}) => {
  if (results.length === 0) return null;

  const colorClasses = {
    good: "text-green-400",
    improvements: "text-yellow-400",
    errors: "text-red-400",
  };

  return (
    <Disclosure as="div" className="mt-2" defaultOpen={type !== "good"}>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex justify-between w-full px-3 py-2 text-sm font-medium text-left text-white bg-brand-dark/50 rounded-lg hover:bg-brand-dark focus:outline-none">
            <span className={colorClasses[type]}>
              {title} ({results.length})
            </span>
            <ChevronDown
              className={`${
                open ? "transform rotate-180" : ""
              } w-5 h-5 text-gray-400`}
            />
          </Disclosure.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="px-3 pt-3 pb-1 text-sm text-gray-500">
              {/* MODIFIED: Pass the suggestion to the AnalysisItem */}
              <ul className="space-y-2">
                {results.map((item) => (
                  <AnalysisItem
                    key={item.message}
                    text={item.message}
                    suggestion={item.suggestion}
                    type={type}
                  />
                ))}
              </ul>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
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

      <div className="space-y-1">
        <AnalysisSection
          title="Critical Errors"
          results={result.results.critical}
          type="errors"
        />
        <AnalysisSection
          title="Keyword Optimization"
          results={result.results.keyword.filter((r) => r.points < 10)}
          type="improvements"
        />
        <AnalysisSection
          title="Structure & Readability"
          results={result.results.structure.filter((r) => r.points < 5)}
          type="improvements"
        />
        <AnalysisSection
          title="Technical SEO"
          results={result.results.technical.filter((r) => r.points < 5)}
          type="improvements"
        />
        <AnalysisSection
          title="Good Results"
          results={[
            ...result.results.keyword,
            ...result.results.structure,
            ...result.results.technical,
          ].filter((r) => r.points >= 5)}
          type="good"
        />
      </div>
    </div>
  );
});

export default SeoAnalysis;
