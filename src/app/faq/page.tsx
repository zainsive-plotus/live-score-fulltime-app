// src/app/faq/page.tsx
"use client"; // This is now a client component to handle search state

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import FaqAccordion from "@/components/FaqAccordion";
import { HelpCircle, Info, Search, MessageSquarePlus } from "lucide-react";
import CasinoPartnerWidget from "@/components/CasinoPartnerWidget";
import { IFaq } from "@/models/Faq";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";

// --- Data Fetching (now uses useQuery) ---
const fetchFaqs = async (): Promise<IFaq[]> => {
  const { data } = await axios.get("/api/faqs");
  return data;
};

export default function FaqPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allFaqs, isLoading } = useQuery<IFaq[]>({
    queryKey: ["publicFaqs"],
    queryFn: fetchFaqs,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // --- Grouping and Filtering Logic ---
  const groupedAndFilteredFaqs = useMemo(() => {
    if (!allFaqs) return {};

    // First, filter by the search term (case-insensitive)
    const filtered =
      searchTerm.length > 2
        ? allFaqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allFaqs;

    // Then, group the filtered results by category
    return filtered.reduce((acc, faq) => {
      const category = faq.category || "General Questions";
      if (!acc[category]) acc[category] = [];
      acc[category].push(faq);
      return acc;
    }, {} as Record<string, IFaq[]>);
  }, [allFaqs, searchTerm]);

  const categories = Object.keys(groupedAndFilteredFaqs);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0 space-y-8">
          {/* --- NEW: Hero Header --- */}
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl text-center">
            <HelpCircle className="w-12 h-12 text-[var(--brand-accent)] mx-auto mb-4" />
            <h1 className="text-4xl font-extrabold text-white">Help Center</h1>
            <p className="text-text-muted mt-2 max-w-2xl mx-auto">
              Have questions? We're here to help. Find answers to common
              questions below or search for a specific topic.
            </p>
          </div>

          {/* --- NEW: Search Bar --- */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a question or keyword..."
              className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-4 pl-12 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            />
          </div>

          {/* --- Dynamic Content Display --- */}
          {isLoading ? (
            <div className="bg-brand-secondary rounded-lg p-8 text-center text-text-muted">
              Loading...
            </div>
          ) : categories.length > 0 ? (
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
              <p>Your search for "{searchTerm}" did not match any questions.</p>
            </div>
          )}

          {/* --- NEW: Call to Action --- */}
          <div className="bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Can't find your answer?
            </h3>
            <p className="text-text-secondary mb-4">
              Our support team is always ready to assist you.
            </p>
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center gap-2 bg-[var(--brand-accent)] text-white font-bold py-2 px-5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <MessageSquarePlus size={18} /> Contact Support
            </Link>
          </div>
        </main>

        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          {/* <CasinoPartnerWidget /> */}
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
