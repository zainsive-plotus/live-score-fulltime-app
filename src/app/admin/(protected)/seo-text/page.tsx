import { Suspense } from "react";
import { FileText } from "lucide-react";
import dbConnect from "@/lib/dbConnect";
import { ILanguage } from "@/models/Language";
import Language from "@/models/Language";
import SeoContent, { ISeoContent } from "@/models/SeoContent";
import SeoTemplate, { ISeoTemplate } from "@/models/SeoTemplate";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import SeoContentManager from "./SeoContentManager";

// This is the default page type that will be loaded on the server.
const INITIAL_PAGE_TYPE = "league-standings";

// Fetches only the data needed for the initial page load.
async function getInitialSeoPageData() {
  await dbConnect();

  const [languages, masterTemplate, contentItems] = await Promise.all([
    Language.find({ isActive: true }).lean(),
    SeoTemplate.findOne({
      pageType: INITIAL_PAGE_TYPE,
      language: DEFAULT_LOCALE,
    }).lean(),
    SeoContent.find({ pageType: INITIAL_PAGE_TYPE }).lean(),
  ]);

  return {
    languages: JSON.parse(JSON.stringify(languages)) as ILanguage[],
    masterTemplate: JSON.parse(
      JSON.stringify(masterTemplate)
    ) as ISeoTemplate | null,
    initialContentItems: JSON.parse(
      JSON.stringify(contentItems)
    ) as ISeoContent[],
  };
}

const Skeleton = () => (
  <div className="mt-8 space-y-4">
    <div className="h-12 w-full rounded-lg bg-brand-secondary animate-pulse"></div>
    <div className="h-64 w-full rounded-lg bg-brand-secondary animate-pulse"></div>
  </div>
);

export default async function SeoTextRunnerPage() {
  const pageData = await getInitialSeoPageData();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText size={28} /> SEO Content Manager
        </h1>
      </div>

      <Suspense fallback={<Skeleton />}>
        <SeoContentManager
          initialPageType={INITIAL_PAGE_TYPE}
          initialLanguages={pageData.languages}
          initialMasterTemplate={pageData.masterTemplate}
          initialContentItems={pageData.initialContentItems}
        />
      </Suspense>
    </div>
  );
}
