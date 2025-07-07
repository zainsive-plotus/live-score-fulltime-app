// src/lib/odds-converter.ts

/**
 * Converts a win percentage into a decimal odd format.
 * @param percent The prediction confidence percentage (e.g., 45 for 45%).
 * @returns The decimal odd as a string (e.g., "2.22"), or "N/A" if invalid.
 */
export const convertPercentageToOdds = (
  percent: number | undefined | null
): string => {
  if (percent === null || percent === undefined || percent <= 0) {
    return "N/A";
  }
  // Ensure we don't divide by zero and handle unrealistically high confidences
  const safePercent = Math.max(1, Math.min(percent, 99));
  return (100 / safePercent).toFixed(2);
};
