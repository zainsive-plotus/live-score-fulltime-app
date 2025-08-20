// ===== tailwind.config.js =====

const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // CHANGE: This section overrides the default container widths
    container: {
      center: true, // This keeps the container centered on the page
      padding: {
        DEFAULT: "1rem", // Default padding for mobile
        sm: "2rem",
      },
      screens: {
        // These are ~80% of Tailwind's default values
        sm: "512px",
        md: "614px",
        lg: "819px",
        xl: "1024px",
        "2xl": "1229px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      // You can keep your other theme extensions here
      colors: {
        "brand-dark": "#1F1D2B",
        "brand-secondary": "#252837",
        "brand-purple": "#8B5CF6",
        "brand-accent": "#ED5C19",
        "brand-live": "#EF4444",
        "text-primary": "#FFFFFF",
        "text-secondary": "#E0E0E0",
        "text-muted": "#9E9E9E",
      },
    },
  },
  plugins: [],
};
