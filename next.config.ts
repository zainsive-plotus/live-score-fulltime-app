import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      {
        protocol: "https",
        hostname: "media.api-sports.io",
        port: "",
        pathname: "/**", // Allow any image path from this bucket
      },
      {
        protocol: "https",
        hostname: "media.api-sports.io",
        port: "",
        pathname: "/flags/**", // Or just '/', depending on how specific you want to be
      },
    ],
    domains: ["*"],
  },
  i18n: {
    // A list of all locales you want to support
    locales: ["en", "tr"],
    // The default locale to use when none is specified in the URL (e.g., at the root domain)
    defaultLocale: "en",
  },
};

export default nextConfig;
