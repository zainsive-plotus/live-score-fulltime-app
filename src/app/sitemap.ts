// src/app/sitemap.ts
// TEMPORARY FILE FOR DEBUGGING SITEMAP GENERATION IN PRODUCTION

import { MetadataRoute } from "next";

// Define a static base URL directly for this test.
// Replace 'https://www.fanskor.com' with your actual production domain.
const BASE_URL_STATIC_TEST = "https://www.fanskor.com";

console.log(
  `[Sitemap Debug Test] Attempting to generate static sitemap for BASE_URL: ${BASE_URL_STATIC_TEST}`
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  console.log("[Sitemap Debug Test] Starting static sitemap generation...");

  const urls = [
    {
      url: `${BASE_URL_STATIC_TEST}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL_STATIC_TEST}/football/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL_STATIC_TEST}/football/leagues`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL_STATIC_TEST}/football/teams`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  console.log(
    `[Sitemap Debug Test] Finished static sitemap generation. Total URLs: ${urls.length}`
  );
  return urls;
}
