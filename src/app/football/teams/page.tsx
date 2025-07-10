// src/app/football/teams/page.tsx
import type { Metadata } from "next";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamListClient from "@/components/TeamListClient"; // Import our new client component
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { Users } from "lucide-react";

// --- Server-side data fetching for the initial popular teams ---
const fetchPopularTeams = async () => {
  const publicAppUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (!publicAppUrl) {
    console.error(
      "[Teams Page Server] NEXT_PUBLIC_PUBLIC_APP_URL is not defined."
    );
    return [];
  }
  const apiUrl = `${publicAppUrl}/api/directory/teams`;
  try {
    const { data } = await axios.get(apiUrl, { timeout: 15000 });
    return data;
  } catch (error: any) {
    console.error(
      `[Teams Page Server] Failed to fetch popular teams (${apiUrl}):`,
      error.message
    );
    return [];
  }
};

// --- SEO Metadata ---
export const metadata: Metadata = {
  title: "Futbol Takımları Rehberi | Favori Kulübünüzü Bulun",
  description:
    "Dünyanın dört bir yanındaki popüler liglerden futbol takımlarının kapsamlı bir dizinine göz atın. Ayrıntılı bilgiler, kadrolar, fikstürler ve daha fazlasını bulun.",
  alternates: {
    canonical: `/football/teams`,
  },
};

// --- MAIN PAGE COMPONENT ---
export default async function TeamsPage() {
  const initialTeams = await fetchPopularTeams();

  const seoDescription =
    "Profesyonel futbol kulüplerinden oluşan kapsamlı rehberimizi keşfedin. İster en üst düzey devleri takip edin, ister yeni favoriler keşfedin, ihtiyacınız olan tüm bilgileri burada bulabilirsiniz. Takımları arayın, en son performans verilerini görüntüleyin ve kulüp futbolu dünyasına derinlemesine dalın.";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0">
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-[var(--brand-accent)]/10 rounded-lg">
                <Users className="w-8 h-8 text-[var(--brand-accent)]" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white">
                  Futbol Takımları
                </h1>
                <p className="text-text-muted">
                  Dünyanın dört bir yanındaki kulüplere göz atın ve arama yapın.
                </p>
              </div>
            </div>
            <p className="italic text-[#a3a3a3] leading-relaxed text-sm mt-4">
              {seoDescription}
            </p>
          </div>

          {/* Render the Client Component with the initial data */}
          <TeamListClient initialTeams={initialTeams} />
        </main>

        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          {/* <CasinoPartnerWidget /> */}
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
