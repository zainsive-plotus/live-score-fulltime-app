// ===== src/lib/seo-analyzer.ts =====

import "client-only"; // This module is designed to run in the browser
import slugify from "slugify";

// --- Helper Functions ---

/**
 * A simple utility to strip HTML tags from a string.
 */
const stripHtml = (html: string): string => {
  if (typeof window === "undefined") {
    // Basic server-side fallback if needed, though this module is client-only.
    return html.replace(/<[^>]*>?/gm, "");
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

/**
 * Counts the occurrences of a keyword in a text, case-insensitively.
 */
const countKeywordOccurrences = (text: string, keyword: string): number => {
  if (!text || !keyword) return 0;
  const regex = new RegExp(`\\b${keyword}\\b`, "gi");
  return (text.match(regex) || []).length;
};

// --- Main Analysis Logic ---

export interface SeoAnalysisResult {
  score: number;
  analysis: {
    good: string[];
    improvements: string[];
    errors: string[];
  };
}

export const analyzeSeo = (
  post: {
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
  },
  focusKeyword: string
): SeoAnalysisResult => {
  const analysis: any = { good: [], improvements: [], errors: [] };
  if (!focusKeyword) {
    return {
      score: 0,
      analysis: { ...analysis, errors: ["No focus keyword provided."] },
    };
  }

  const contentText = stripHtml(post.content);
  const wordCount = contentText.split(/\s+/).filter(Boolean).length;

  // --- Keyword Checks (based on your SOP) ---

  // 1. Meta Title
  if (post.metaTitle) {
    if (post.metaTitle.toLowerCase().includes(focusKeyword.toLowerCase())) {
      analysis.good.push("Focus keyword is in the meta title.");
    } else {
      analysis.improvements.push("Add the focus keyword to the meta title.");
    }
    if (post.metaTitle.length > 60) {
      analysis.improvements.push(
        `Meta title is too long (${post.metaTitle.length}/60).`
      );
    } else {
      analysis.good.push("Meta title length is good.");
    }
  } else {
    analysis.errors.push("Meta title is missing.");
  }

  // 2. Meta Description
  if (post.metaDescription) {
    if (
      post.metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())
    ) {
      analysis.good.push("Focus keyword is in the meta description.");
    } else {
      analysis.improvements.push(
        "Add the focus keyword to the meta description."
      );
    }
    if (post.metaDescription.length > 160) {
      analysis.improvements.push(
        `Meta description is too long (${post.metaDescription.length}/160).`
      );
    } else {
      analysis.good.push("Meta description length is good.");
    }
  } else {
    analysis.errors.push("Meta description is missing.");
  }

  // 3. H1 Title
  if (post.title.toLowerCase().includes(focusKeyword.toLowerCase())) {
    analysis.good.push("Focus keyword is in the main title (H1).");
  } else {
    analysis.errors.push("Add the focus keyword to the main title (H1).");
  }

  // 4. URL Slug
  if (
    post.slug &&
    post.slug.includes(slugify(focusKeyword, { lower: true, strict: true }))
  ) {
    analysis.good.push("Focus keyword is in the URL slug.");
  } else {
    analysis.improvements.push(
      "Consider adding the focus keyword to the URL slug."
    );
  }

  // 5. First 100 words
  if (
    contentText
      .substring(0, 150)
      .toLowerCase()
      .includes(focusKeyword.toLowerCase())
  ) {
    analysis.good.push("Focus keyword appears in the first paragraph.");
  } else {
    analysis.errors.push(
      "Focus keyword not found in the first paragraph. Add it near the beginning."
    );
  }

  // 6. Keyword Density
  const occurrences = countKeywordOccurrences(contentText, focusKeyword);
  const density = wordCount > 0 ? (occurrences / wordCount) * 100 : 0;
  if (density >= 0.8 && density <= 2.5) {
    analysis.good.push(
      `Keyword density is good (${occurrences} times, ${density.toFixed(1)}%).`
    );
  } else if (density < 0.8) {
    analysis.improvements.push(
      `Keyword density is low. Use the focus keyword ${Math.ceil(
        wordCount * 0.01 - occurrences
      )} more times.`
    );
  } else {
    analysis.improvements.push(
      `Keyword density is high (${density.toFixed(
        1
      )}%). Consider reducing its use to avoid stuffing.`
    );
  }

  // 7. Word Count
  if (wordCount >= 300) {
    analysis.good.push(`Content length is good (${wordCount} words).`);
  } else {
    analysis.improvements.push(
      `Content is too short (${wordCount} words). Aim for at least 300 words.`
    );
  }

  // --- Calculate Final Score ---
  const totalChecks =
    analysis.good.length +
    analysis.improvements.length +
    analysis.errors.length;
  const goodRatio = totalChecks > 0 ? analysis.good.length / totalChecks : 0;
  // Penalize more heavily for errors
  const errorPenalty =
    totalChecks > 0 ? analysis.errors.length / totalChecks : 0;
  const score = Math.round((goodRatio - errorPenalty * 0.5) * 100);

  return { score: Math.max(0, score), analysis };
};
