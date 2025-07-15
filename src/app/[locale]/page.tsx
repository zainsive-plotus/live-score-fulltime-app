import { Suspense } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { SidebarSkeleton } from "@/components/LayoutSkeletons";
import { getI18n } from "@/lib/i18n/server";

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
  // These props are passed from the root page.tsx for the default locale
  homepageAboutSeoText?: string;
  sidebarAboutSeoText?: string;
}

export default async function HomePage({
  params,
  homepageAboutSeoText: initialHomepageText,
  sidebarAboutSeoText: initialSidebarText,
}: HomePageProps) {
  const { locale } = await params;

  // If the props aren't passed (i.e., when rendering a non-default locale),
  // we fetch the translations here.
  const t = await getI18n(locale);
  const homepageAboutSeoText =
    initialHomepageText || t("homepage_about_seo_text");
  const sidebarAboutSeoText = initialSidebarText || t("sidebar_about_seo_text");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:items-start lg:py-8">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <main className="min-w-0">
          <MainContent
            sidebarAboutSeoText={sidebarAboutSeoText}
            homepageAboutSeoText={homepageAboutSeoText}
          />
        </main>
      </div>
    </div>
  );
}
