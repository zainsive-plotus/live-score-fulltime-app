import { Suspense } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { SidebarSkeleton } from "@/components/LayoutSkeletons";
import { getI18n } from "@/lib/i18n/server"; // <-- Import server helper

export default async function HomePage() {
  const t = await getI18n(); // <-- Get translations on the server

  // Fetch translated SEO text
  const homepageAboutSeoText = t("homepage_about_seo_text");
  const sidebarAboutSeoText = t("sidebar_about_seo_text");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:items-start lg:py-8">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <main className="min-w-0">
          {/* Pass the translated text as props */}
          <MainContent
            sidebarAboutSeoText={sidebarAboutSeoText}
            homepageAboutSeoText={homepageAboutSeoText}
          />
        </main>
      </div>
    </div>
  );
}
