import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // --- THE FIX: `colors` is now the primary color palette ---
    // This completely REPLACES Tailwind's default colors.
    colors: {
      // Your Brand Colors
      "brand-dark": "#1F1D2B",
      "brand-secondary": "#252836",
      "brand-light": "#F1F2F3",
      "brand-muted": "#A0A4A8",
      "brand-accent": "#16A34A",
      "brand-live": "#EF4444",
      "brand-purple": "#6C5ECF",

      // Essential colors it's good practice to keep
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      black: "#000000",

      // You can add back specific default colors if you need them elsewhere
      // For example, if you use `bg-red-500` for errors
      "red-500": "#ef4444",
      "gray-600": "#4b5563",
      "gray-700": "#374151",
    },

    keyframes: {
      "breathing-glow": {
        "0%, 100%": {
          // Use a CSS variable for the color to make it easily themeable
          boxShadow: "0 0 10px 0px rgba(52, 211, 153, 0.4)",
          transform: "scale(1)",
        },
        "50%": {
          boxShadow: "0 0 25px 5px rgba(52, 211, 153, 0.7)",
          transform: "scale(1.05)",
        },
      },
    },
    // Animation applies the keyframes
    animation: {
      "breathing-glow": "breathing-glow 2.5s ease-in-out infinite",
    },

    // `extend` is now only for adding things that don't replace the theme, like fonts.
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwind-scrollbar"), require("@tailwindcss/typography")],
};

export default config;
