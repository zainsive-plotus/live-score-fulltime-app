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
        hostname: "live-score-post-images.s3.ap-southeast-2.amazonaws.com",
        port: "",
        pathname: "/**", // Allow any image path from this bucket
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.stickpng.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.inter.it",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.api-sports.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media-4.api-sports.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "thumbs.dreamstime.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  i18n: {
    // A list of all locales you want to support
    locales: ["en", "tr"],
    // The default locale to use when none is specified in the URL (e.g., at the root domain)
    defaultLocale: "en",
  },
};

export default nextConfig;
