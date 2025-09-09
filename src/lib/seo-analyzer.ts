// ===== src/lib/seo-analyzer.ts =====

import "client-only";
import slugify from "slugify";

// --- Helper Functions ---
const stripHtml = (html: string): string => {
  if (typeof window === "undefined") return html.replace(/<[^>]*>?/gm, "");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const countOccurrences = (text: string, keyword: string): number => {
  if (!text || !keyword) return 0;
  const regex = new RegExp(
    `\\b${keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
    "gi"
  );
  return (text.match(regex) || []).length;
};

// --- Type Definitions ---
interface PostData {
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  secondaryKeywords?: string[];
  supportingKeywords?: string[];
}

// MODIFIED: AnalysisResult now includes an optional `suggestion` field
interface AnalysisResult {
  message: string;
  points: number;
  suggestion?: string;
}

export interface SeoAnalysisResult {
  score: number;
  results: {
    critical: AnalysisResult[];
    keyword: AnalysisResult[];
    structure: AnalysisResult[];
    technical: AnalysisResult[];
  };
}

// --- Main Analysis Logic ---
export const analyzeSeo = (
  post: PostData,
  focusKeyword: string
): SeoAnalysisResult => {
  const results: any = {
    critical: [],
    keyword: [],
    structure: [],
    technical: [],
  };
  if (!focusKeyword) {
    return {
      score: 0,
      results: {
        critical: [
          {
            message: "No focus keyword provided.",
            points: -100,
            suggestion: "Add a focus keyword to start the analysis.",
          },
        ],
        keyword: [],
        structure: [],
        technical: [],
      },
    };
  }

  const contentText = stripHtml(post.content);
  const wordCount = contentText.split(/\s+/).filter(Boolean).length;
  const first150Words = contentText.substring(0, 150).toLowerCase();

  // --- CRITICAL CHECKS ---
  if (!post.metaTitle?.toLowerCase().includes(focusKeyword.toLowerCase())) {
    results.critical.push({
      message: "Focus keyword not in Meta Title.",
      points: -20,
      suggestion:
        "Click on the 'SEO & Linking' section and add your keyword to the 'Meta Title' field.",
    });
  }
  if (!post.title.toLowerCase().includes(focusKeyword.toLowerCase())) {
    results.critical.push({
      message: "Focus keyword not in H1 Title.",
      points: -20,
      suggestion: "Your main post title should contain the focus keyword.",
    });
  }
  if (!first150Words.includes(focusKeyword.toLowerCase())) {
    results.critical.push({
      message: "Focus keyword not in the first paragraph.",
      points: -15,
      suggestion:
        "Rewrite your opening sentence or paragraph to include the focus keyword naturally.",
    });
  }

  // --- KEYWORD OPTIMIZATION (40 points) ---
  results.keyword.push(
    post.metaTitle?.toLowerCase().includes(focusKeyword.toLowerCase())
      ? { message: "Keyword in Meta Title.", points: 10 }
      : {
          message: "Keyword missing from Meta Title.",
          points: 0,
          suggestion:
            "Add your focus keyword to the 'Meta Title' field in the 'SEO & Linking' section.",
        }
  );
  results.keyword.push(
    post.title.toLowerCase().includes(focusKeyword.toLowerCase())
      ? { message: "Keyword in H1 Title.", points: 10 }
      : {
          message: "Keyword missing from H1 Title.",
          points: 0,
          suggestion: "Add your focus keyword to the main post title.",
        }
  );
  results.keyword.push(
    first150Words.includes(focusKeyword.toLowerCase())
      ? { message: "Keyword in first paragraph.", points: 5 }
      : {
          message: "Keyword missing from first paragraph.",
          points: 0,
          suggestion:
            "Include your focus keyword within the first 100-150 words of your content.",
        }
  );

  const occurrences = countOccurrences(contentText, focusKeyword);
  const density = wordCount > 0 ? (occurrences / wordCount) * 100 : 0;
  if (density >= 0.8 && density <= 2.5) {
    results.keyword.push({
      message: `Keyword density is good (${density.toFixed(1)}%).`,
      points: 5,
    });
  } else {
    const suggestion =
      density < 0.8
        ? `Try to use the keyword at least ${Math.ceil(
            wordCount * 0.01 - occurrences
          )} more time(s).`
        : "Reduce the number of times you use the keyword to avoid stuffing.";
    results.keyword.push({
      message: `Keyword density is ${
        density < 0.8 ? "low" : "high"
      } (${density.toFixed(1)}%). Aim for 1-2%.`,
      points: 1,
      suggestion,
    });
  }

  const secondaryInHeadings =
    post.secondaryKeywords?.some((kw) =>
      new RegExp(`<h[2-3][^>]*>.*?\\b${kw}\\b.*?<\/h[2-3]>`, "i").test(
        post.content
      )
    ) ?? false;
  results.keyword.push(
    secondaryInHeadings
      ? { message: "Secondary keyword found in a subheading.", points: 10 }
      : {
          message: "Secondary keyword missing from subheadings.",
          points: 0,
          suggestion:
            "Incorporate one of your secondary keywords into an H2 or H3 heading.",
        }
  );

  // --- CONTENT STRUCTURE & READABILITY (30 points) ---
  results.structure.push(
    post.metaTitle && post.metaTitle.length >= 50 && post.metaTitle.length <= 60
      ? { message: "Meta Title length is optimal.", points: 5 }
      : {
          message: `Meta Title length is ${post.metaTitle?.length || 0}/60.`,
          points: 1,
          suggestion:
            "Aim for a meta title between 50 and 60 characters for best visibility.",
        }
  );
  results.structure.push(
    post.metaDescription &&
      post.metaDescription.length >= 150 &&
      post.metaDescription.length <= 160
      ? { message: "Meta Description length is optimal.", points: 5 }
      : {
          message: `Meta Description length is ${
            post.metaDescription?.length || 0
          }/160.`,
          points: 1,
          suggestion:
            "Aim for a meta description between 150 and 160 characters.",
        }
  );
  results.structure.push(
    wordCount >= 300
      ? { message: `Content length is good (${wordCount} words).`, points: 10 }
      : {
          message: `Content is short (${wordCount} words).`,
          points: 2,
          suggestion:
            "Longer content tends to rank better. Aim for at least 300 words.",
        }
  );
  results.structure.push(
    /<h[2-3]/.test(post.content)
      ? { message: "Subheadings (H2/H3) are used.", points: 5 }
      : {
          message: "Missing subheadings.",
          points: 0,
          suggestion:
            "Break up your content with H2 and H3 tags to improve readability and structure.",
        }
  );
  results.structure.push(
    wordCount / (post.content.split("</p>").length - 1) < 40
      ? { message: "Paragraphs seem concise.", points: 5 }
      : {
          message: "Some paragraphs may be too long.",
          points: 2,
          suggestion:
            "For better readability on the web, try to keep paragraphs to a maximum of 3-4 lines.",
        }
  );

  // --- TECHNICAL & SEMANTIC SEO (30 points) ---
  const slugifiedKeyword = slugify(focusKeyword, { lower: true, strict: true });
  results.technical.push(
    post.slug?.includes(slugifiedKeyword)
      ? { message: "Keyword is in the URL slug.", points: 5 }
      : {
          message: "Keyword not in URL slug.",
          points: 0,
          suggestion:
            "Edit the slug to include your focus keyword for better relevance.",
        }
  );

  const imageCount = (post.content.match(/<img/g) || []).length;
  results.technical.push(
    imageCount > 0
      ? { message: `Includes ${imageCount} image(s).`, points: 5 }
      : {
          message: "No images found in content.",
          points: 0,
          suggestion:
            "Adding relevant images can improve engagement. Aim for at least one.",
        }
  );

  const hasImagesWithoutAlt = /<img(?!.*?alt="[^"]*")[^>]*>/.test(post.content);
  results.technical.push(
    imageCount > 0 && !hasImagesWithoutAlt
      ? { message: "All images have alt text.", points: 5 }
      : {
          message: "Some images are missing alt text.",
          points: 0,
          suggestion:
            "Add descriptive alt text to all images for accessibility and SEO.",
        }
  );

  const internalLinks = (post.content.match(/href="\//g) || []).length;
  const externalLinks = (post.content.match(/href="http/g) || []).length;
  results.technical.push(
    internalLinks > 0 && externalLinks > 0
      ? { message: "Contains both internal and external links.", points: 10 }
      : {
          message: "Missing internal or external links.",
          points: 2,
          suggestion:
            "A healthy article links to other relevant pages on your site and to external authority sites.",
        }
  );

  const supportingKeywordsUsed =
    post.supportingKeywords?.some((kw) =>
      contentText.toLowerCase().includes(kw.toLowerCase())
    ) ?? false;
  results.technical.push(
    supportingKeywordsUsed
      ? { message: "Supporting keywords are used.", points: 5 }
      : {
          message: "Supporting keywords not found.",
          points: 0,
          suggestion:
            "Sprinkle some of your supporting keywords throughout the content to improve semantic relevance.",
        }
  );

  // --- Calculate Final Score ---
  const allChecks = [
    ...results.keyword,
    ...results.structure,
    ...results.technical,
  ];
  let totalPoints = allChecks.reduce((sum, check) => sum + check.points, 0);
  results.critical.forEach((err) => (totalPoints += err.points));

  return { score: Math.max(0, Math.min(100, totalPoints)), results };
};
