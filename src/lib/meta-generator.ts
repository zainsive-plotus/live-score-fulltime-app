import metaTemplates from "public/data/dynamic-meta.json";

type PageType = "team" | "match";
type PlaceholderValues = { [key: string]: string | number };

/**
 * Generates a title and description from a template.
 * @param pageType - The type of page (e.g., 'team', 'match').
 * @param locale - The current locale.
 * @param values - An object of placeholders and their values.
 * @returns An object with the final title and description.
 */
export function generateDynamicMeta(
  pageType: PageType,
  locale: string,
  values: PlaceholderValues
): { title: string; description: string } {
  const templates = (metaTemplates as any)[pageType];
  if (!templates) {
    return { title: "Fanskor", description: "Live football scores and news." };
  }

  // Use the specific locale template, or fall back to English if it doesn't exist.
  const template = templates[locale] || templates.en;

  let { title, description } = template;

  // Replace all placeholders like {teamName} with their actual values.
  for (const key in values) {
    const regex = new RegExp(`{${key}}`, "g");
    title = title.replace(regex, values[key]);
    description = description.replace(regex, values[key]);
  }

  return { title, description };
}
