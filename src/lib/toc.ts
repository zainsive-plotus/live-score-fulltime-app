// ===== src/lib/toc.ts =====

import * as cheerio from "cheerio";
import slugify from "slugify";

export interface TocEntry {
  level: "h2" | "h3";
  id: string;
  text: string;
}

export function generateTableOfContents(htmlContent: string): {
  processedHtml: string;
  toc: TocEntry[];
} {
  if (!htmlContent) {
    return { processedHtml: "", toc: [] };
  }

  const $ = cheerio.load(htmlContent);
  const toc: TocEntry[] = [];

  // Find all h2 and h3 tags
  $("h2, h3").each((index, element) => {
    const el = $(element);
    const text = el.text();
    const level = el.is("h2") ? "h2" : "h3";

    // Create a unique, URL-friendly ID from the heading text
    const baseId = slugify(text, { lower: true, strict: true });
    let id = baseId;
    let counter = 1;
    // Ensure the ID is unique on the page
    while ($(`#${id}`).length > 0) {
      id = `${baseId}-${counter}`;
      counter++;
    }

    // Add the id attribute to the heading tag in the HTML
    el.attr("id", id);

    // Add the heading to our table of contents list
    toc.push({ level, id, text });
  });

  // Return the modified HTML and the list of headings
  return {
    processedHtml: $.html(),
    toc,
  };
}
