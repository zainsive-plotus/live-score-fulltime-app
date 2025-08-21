// ===== next.config.js =====

import type { NextConfig } from "next";
const { fontFamily } = require("tailwindcss/defaultTheme");

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
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
    // CHANGE: This is the correct way to allow images from any source.
    // The `remotePatterns` array is used with a wildcard hostname.
    // The deprecated `domains` array has been completely removed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allows any hostname under HTTPS
      },
      {
        protocol: "http",
        hostname: "**", // Allows any hostname under HTTP
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
