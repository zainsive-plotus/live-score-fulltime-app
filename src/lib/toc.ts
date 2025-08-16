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

  $("h2, h3").each((index, element) => {
    const el = $(element);
    const text = el.text();
    const level = el.is("h2") ? "h2" : "h3";

    // CHANGE: Add a reliable prefix to all generated IDs.
    // This prevents IDs from starting with numbers or special characters that can break CSS selectors.
    const baseId = `toc-${slugify(text, { lower: true, strict: true })}`;
    let id = baseId;
    let counter = 1;

    // This loop now checks against a valid selector format.
    while ($(`[id="${id}"]`).length > 0) {
      id = `${baseId}-${counter}`;
      counter++;
    }

    el.attr("id", id);

    toc.push({ level, id, text });
  });

  return {
    processedHtml: $.html(),
    toc,
  };
}
