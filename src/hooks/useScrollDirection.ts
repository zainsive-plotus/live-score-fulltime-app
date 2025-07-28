// ===== src/hooks/useScrollDirection.ts =====

"use client";

import { useState, useEffect, useRef } from 'react';

interface ScrollDirectionOptions {
  /** The scroll distance in pixels from the top of the page before the effect starts. */
  threshold?: number;
}

/**
 * A custom React hook to determine scroll direction and sticky state.
 * @param {ScrollDirectionOptions} options - Configuration options.
 * @returns {{ isSticky: boolean, isVisible: boolean }} - An object containing the sticky and visibility states.
 */
export function useScrollDirection({ threshold = 200 }: ScrollDirectionOptions = {}) {
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine if the header should be in a "sticky" state
      if (currentScrollY > threshold) {
        setIsSticky(true);
        // Determine visibility only when in sticky state
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false); // Scrolling down, hide header
        } else {
          setIsVisible(true); // Scrolling up, show header
        }
      } else {
        // Not past the threshold, so not sticky and always visible
        setIsSticky(false);
        setIsVisible(true);
      }

      // Update last scroll position
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return { isSticky, isVisible };
}