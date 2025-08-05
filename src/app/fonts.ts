// ===== src/app/fonts.ts =====
import { Inter } from "next/font/google";

// Configure the Inter font with necessary subsets and a performance-friendly display strategy.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap", // This is crucial: it tells the browser to show a fallback font immediately while Inter loads.
  variable: "--font-sans", // This allows us to reference the font easily in Tailwind CSS.
});
