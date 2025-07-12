// ===== tailwind.config.js =====

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        "brand-dark": "#1F1D2B",
        "brand-secondary": "#252837",
        "brand-purple": "#8B5CF6",
        "brand-highlight": "#3B82F6",
        "brand-live": "#EF4444",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      // ADD THIS SECTION FOR THE ANIMATION
      keyframes: {
        ring: {
          "0%, 100%": { transform: "rotate(0)" },
          "10%": { transform: "rotate(14deg)" },
          "20%": { transform: "rotate(-8deg)" },
          "30%": { transform: "rotate(14deg)" },
          "40%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(10.0deg)" },
          "60%": { transform: "rotate(0)" },
        },
      },
      animation: {
        ring: "ring 2s ease-in-out infinite",
      },
      // END OF ADDED SECTION
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
