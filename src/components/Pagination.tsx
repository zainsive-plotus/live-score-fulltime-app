"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
        aria-label={t("previous_page")}
      >
        <ChevronLeft size={16} />
        <span>{t("previous")}</span>
      </button>

      <span className="text-sm font-semibold text-brand-muted">
        {t("page_of", { currentPage, totalPages })}
      </span>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
        aria-label={t("next_page")}
      >
        <span>{t("next")}</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
