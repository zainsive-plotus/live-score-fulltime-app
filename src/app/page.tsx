import { getI18n } from "@/lib/i18n/server";
import HomePage from "./[locale]/page";

// This is the default Turkish locale.
const DEFAULT_LOCALE = "tr";

/**
 * This root page component handles requests to the base URL (e.g., fanskor.com/).
 * It fetches the content for the default locale ('tr') and renders the
 * standard HomePage component with those props.
 */
export default async function RootPage() {
  const t = await getI18n(DEFAULT_LOCALE);

  // You can fetch any other data needed for the homepage here if necessary
  const homepageAboutSeoText = t("homepage_about_seo_text");
  const sidebarAboutSeoText = t("sidebar_about_seo_text");

  // We are reusing the existing HomePage component from the [locale] directory.
  // We pass the default locale and its specific props to it.
  return (
    <HomePage
      params={{ locale: DEFAULT_LOCALE }}
      homepageAboutSeoText={homepageAboutSeoText}
      sidebarAboutSeoText={sidebarAboutSeoText}
    />
  );
}
