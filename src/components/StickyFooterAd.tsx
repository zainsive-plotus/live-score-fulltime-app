// src/components/StickyFooterAd.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { X } from "lucide-react";

// Self-contained type definition
interface IBanner {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

export default function StickyFooterAd() {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("footerAdDismissed") === "true") {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, []);

  // --- MODIFIED: The API call is now parameterized directly ---
  // This uses the existing data fetching pattern without introducing new functions.
  const { data: banners, isLoading } = useQuery<IBanner[]>({
    // A more specific query key to avoid cache collisions with other banner slots.
    queryKey: ["sticky_footer"],
    queryFn: () =>
      axios
        .get("/api/banners?active=true&location=sticky_footer")
        .then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const randomAd = useMemo(() => {
    if (!banners || banners.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * banners.length);
    return banners[randomIndex];
  }, [banners]);

  // Effect to trigger the slide-up animation
  useEffect(() => {
    if (!isLoading && randomAd && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, randomAd, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDismissed(true);
      sessionStorage.setItem("footerAdDismissed", "true");
    }, 500);
  };

  if (!randomAd || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 top-auto z-50 flex justify-center p-2 pointer-events-none">
      <div
        className={`
          pointer-events-auto flex items-center gap-4 w-full max-w-lg 
          bg-brand-secondary/80 backdrop-blur-sm 
          border border-gray-600/50 shadow-2xl shadow-black/50 rounded-lg
          transition-all duration-500 ease-in-out
          ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          }
        `}
      >
        <a
          href={randomAd.linkUrl}
          target="_blank"
          rel="noopener sponsored"
          className="flex-grow flex items-center gap-4 p-3 group"
        >
          <div className="flex-shrink-0 w-20 h-16 relative">
            <Image
              src={randomAd.imageUrl}
              alt={randomAd.title}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs text-brand-muted">Sponsored</p>
            <h4 className="font-bold text-white truncate group-hover:text-brand-purple transition-colors">
              {randomAd.title}
            </h4>
          </div>
        </a>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 self-start p-2 text-brand-muted hover:text-white"
          aria-label="Close ad"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
