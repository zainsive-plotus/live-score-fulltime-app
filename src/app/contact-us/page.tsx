// src/app/contact-us/page.tsx
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import axios from "axios"; // For server-side data fetching

import ContactFormClient from "@/components/ContactFormClient";
import NewsListItem from "@/components/NewsListItem"; // Reusing for news list (might need prop adjustments)
import AdSlotWidget from "@/components/AdSlotWidget";

const fetchSidebarNews = async (): Promise<any[]> => {
  const publicAppUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (!publicAppUrl) {
    console.error(
      "[Contact Us Page] NEXT_PUBLIC_PUBLIC_APP_URL is not defined! Cannot fetch news."
    );
    return [];
  }
  try {
    // Fetch latest 3 published posts for the sidebar
    const { data } = await axios.get(
      `${publicAppUrl}/api/posts?status=published&limit=3`,
      { timeout: 10000 }
    );
    console.log(
      `[Contact Us Page] Fetched ${data.length} news posts for sidebar.`
    );
    return data;
  } catch (error: any) {
    console.error(
      "[Contact Us Page] Failed to fetch news for sidebar:",
      error.message
    );
    return [];
  }
};

// --- Metadata for the Contact Us page (Server-side) ---
export const metadata: Metadata = {
  title: "Contact Us | Fan Skor Destek",
  description:
    "Get in touch with Fanskor support team. Send us your questions, feedback, or inquiries through our contact form or find our contact details here.",
  alternates: {
    canonical: `/contact-us`,
  },
  openGraph: {
    title: "Contact Us | Fan Skor Destek",
    description:
      "Get in touch with Fanskor support team. Send us your questions, feedback, or inquiries through our contact form or find our contact details here.",
    url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/contact-us`,
    siteName: "Fan Skor",
    type: "website",
  },
};

// --- Main Contact Us Page Component (Server-side) ---
export default async function ContactUsPage() {
  // Make async to await data fetching
  // --- SEO Description for the page content ---
  const contactPageSeoText =
    `Fanskor ekibine ulaşmak için doğru yerdesiniz! ` +
    `Sorularınız, geri bildirimleriniz, ortaklık talepleriniz veya herhangi bir konuda yardıma ihtiyacınız olduğunda bize ulaşmaktan çekinmeyin. ` +
    `Müşteri memnuniyeti bizim için önceliktir ve tüm mesajlarınıza en kısa sürede yanıt vermeyi taahhüt ediyoruz. ` +
    `Aşağıdaki formu kullanarak bize doğrudan mesaj gönderebilir veya iletişim bilgilerimiz aracılığıyla bize ulaşabilirsiniz.`;

  // --- Fetch data for right sidebar in parallel ---
  const [sidebarNews] = await Promise.all([fetchSidebarNews()]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        {" "}
        {/* Changed grid: 288px sidebar, 1fr main, 288px right sidebar */}
        <Sidebar /> {/* Left sidebar */}
        <main className="min-w-0">
          {" "}
          {/* Main content area */}
          {/* Page Heading and Description for SEO */}
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">
              İletişim Kurun
            </h1>
            <p className="text-brand-light text-base leading-relaxed">
              {contactPageSeoText}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {/* Contact Form (Client Component) */}
            <ContactFormClient />

            {/* Contact Details Section (Server-rendered) */}
            <div className="bg-brand-secondary p-8 rounded-lg shadow-xl">
              <h2 className="text-3xl font-bold text-white mb-6">
                İletişim Bilgileri
              </h2>
              <div className="space-y-6 text-brand-light">
                <div className="flex items-center gap-4">
                  <Mail size={24} className="text-brand-purple" />
                  <div>
                    <h3 className="font-semibold text-white">E-posta</h3>
                    <p className="text-brand-muted">support@fanskor.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone size={24} className="text-brand-purple" />
                  <div>
                    <h3 className="font-semibold text-white">Telefon</h3>
                    <p className="text-brand-muted">+90 (555) 123 45 67</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin size={24} className="text-brand-purple" />
                  <div>
                    <h3 className="font-semibold text-white">Adres</h3>
                    <p className="text-brand-muted">
                      Futbol Caddesi No: 10, Skor Mahallesi <br />
                      Şampiyon Şehir, Türkiye
                    </p>
                  </div>
                </div>
                <div className="text-sm pt-4 border-t border-gray-700 text-brand-muted">
                  Mesajınıza 24 saat içinde yanıt vermeyi hedefliyoruz.
                </div>
              </div>
            </div>
          </div>
        </main>
        {/* --- NEW: Right Sidebar --- */}
        <aside className="lg:col-span-1 space-y-8 min-w-0">
          {/* News List Widget */}
          <section className="bg-brand-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Son Haberler</h2>
            {sidebarNews && sidebarNews.length > 0 ? (
              <div className="space-y-4">
                {sidebarNews.map((post: any) => (
                  <NewsListItem key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-brand-muted text-center text-sm">
                Güncel haber bulunamadı.
              </p>
            )}
          </section>
          {/* Ad Slot (Right Sidebar) */}
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
