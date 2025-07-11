import type { NextConfig } from "next";
const { fontFamily } = require("tailwindcss/defaultTheme");

const nextConfig: NextConfig = {
  theme: {
    extend: {
      fontFamily: {
        // Add a new 'sans' property and spread the default sans fonts
        sans: ["Inter", ...fontFamily.sans],
      },
    },
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**", // Allow any image path from this bucket
      },
    ],

    domains: ["*"],

    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
