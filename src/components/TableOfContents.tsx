"use client";

import { useState, useEffect, useRef } from "react";
import { TocEntry } from "@/lib/toc";
import { List } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface TableOfContentsProps {
  toc: TocEntry[];
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -60% 0%", threshold: 1.0 }
    );

    const headings = document.querySelectorAll("h2[id], h3[id]");
    headings.forEach((heading) => {
      observer.current?.observe(heading);
    });

    return () => observer.current?.disconnect();
  }, [toc]);

  if (!toc || toc.length === 0) {
    return null;
  }

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const topOffset =
        element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({
        top: topOffset,
        behavior: "smooth",
      });
      setActiveId(id);
    }
  };

  return (
    // --- START OF MODIFICATION ---
    // Removed "sticky top-24" and added margin and border for better in-content flow.
    <div className="bg-brand-secondary rounded-lg p-6 my-8 border border-gray-700/50">
      {/* --- END OF MODIFICATION --- */}
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <List size={20} className="text-brand-purple" />
        {t("table_of_contents")}
      </h3>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              className={`block text-sm transition-colors duration-200 border-l-2
                ${item.level === "h3" ? "pl-6" : "pl-3"}
                ${
                  activeId === item.id
                    ? "border-brand-purple text-white font-semibold"
                    : "border-transparent text-brand-muted hover:text-white hover:border-gray-500"
                }
              `}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
