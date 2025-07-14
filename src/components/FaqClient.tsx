"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import FaqAccordion from "./FaqAccordion";
import { Info, Search, MessageSquarePlus } from "lucide-react";
import { IFaq } from "@/models/Faq";
import { useTranslation } from "@/hooks/useTranslation";

interface FaqClientProps {
  initialFaqs: IFaq[];
}

export default function FaqClient({ initialFaqs }: FaqClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  const groupedAndFilteredFaqs = useMemo(() => {
    if (!initialFaqs) return {};

    const filtered =
      searchTerm.length > 2
        ? initialFaqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : initialFaqs;

    return filtered.reduce((acc, faq) => {
      const category = faq.category || "General Questions";
      if (!acc[category]) acc[category] = [];
      acc[category].push(faq);
      return acc;
    }, {} as Record<string, IFaq[]>);
  }, [initialFaqs, searchTerm]);

  const categories = Object.keys(groupedAndFilteredFaqs);

  return (
    <>
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          size={20}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("faq_search_placeholder")}
          className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-4 pl-12 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
        />
      </div>

      {categories.length > 0 ? (
        categories.map((category) => (
          <div
            key={category}
            className="bg-brand-secondary rounded-lg shadow-xl overflow-hidden"
          >
            <h2 className="text-2xl font-bold text-white p-6 border-b border-gray-700/50">
              {category}
            </h2>
            <div>
              {groupedAndFilteredFaqs[category].map((faq) => (
                <FaqAccordion
                  key={faq._id}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-brand-secondary rounded-lg p-8 text-center text-text-muted">
          <Info size={32} className="mx-auto mb-3" />
          <p>{t("faq_no_results_message", { searchTerm })}</p>
        </div>
      )}

      <div className="bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          {t("faq_cant_find_answer_title")}
        </h3>
        <p className="text-text-secondary mb-4">
          {t("faq_cant_find_answer_subtitle")}
        </p>
        <Link
          href="/contact-us"
          className="inline-flex items-center justify-center gap-2 bg-[var(--brand-accent)] text-white font-bold py-2 px-5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <MessageSquarePlus size={18} /> {t("contact_support_button")}
        </Link>
      </div>
    </>
  );
}
