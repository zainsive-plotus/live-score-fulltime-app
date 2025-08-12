// ===== src/hooks/useDebounce.ts =====

"use client";

import { useState, useEffect } from "react";

// This custom hook takes a value and a delay time (in ms).
// It returns a new value that only updates after the specified delay has passed
// without the original value changing.
export function useDebounce<T>(value: T, delay: number): T {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Set a timeout to update the debounced value after the delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Return a cleanup function that will be called every time useEffect re-runs.
      // This is the key part: if the `value` changes, the previous timeout is
      // cleared before a new one is set.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}
