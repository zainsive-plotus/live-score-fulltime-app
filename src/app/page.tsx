// src/app/page.tsx
import { Suspense } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent"; // This is a Client Component
import { SidebarSkeleton } from "@/components/LayoutSkeletons";

export default async function HomePage() {
  // --- Generate Homepage About SEO Text ---
  const homepageAboutSeoText = `Fanskor'da, size sadece gerçek zamanlı olarak düzenli olarak güncellenen Türk Süper Ligi'nin sonuçları ve puan durumlarından daha fazlasını sunuyoruz, ayrıca maç başlar başlamaz size en kapsamlı maç incelemesini ve canlı skorları veriyoruz, böylece Fanskor ile her zaman Türk Süper Ligi'nin nabzını tutuyorsunuz!
      Her bir golü veya diğer önemli anları kapsamak için derinlemesine analiz ve takım istatistiklerinin yanı sıra canlı güncellemeler vb. sunuyoruz. Önceden mi planlıyorsunuz? Hiçbir güçlük çekmeden gelecekteki maçları öğrenin ve bir daha asla önemli bir maçı kaçırmayın.
      İster favori takımınızı takip edin, ister ligin tüm maçlarını izleyin, Fanskor size gerçek taraftarın tercihi üzerine gerçek Türk futbolunun mükemmel, eksiksiz, güvenilir ve dinamik bir resmini sağlayabilir.
      Bir oyun takipçisi olmayın, Fanskor ile bir oyun takipçisi olun. Şimdi en yeni, itibarlı ve tek elden kapsamı alın!
      `;
  const sidebarAboutSeoText = `Fanskor, heyecan verici derbileri veya beklenmedik alt kadro hikayelerini takip ediyor olsanız da, size en son haberleri ve analizleri sunar. Fanskor, Türk Süper Ligi haberleri için başvurabileceğiniz kaynağınızdır. Maç programlarını kontrol edebilir, güncel puan durumunu görebilir, canlı sonuçları takip edebilir ve tüm takım istatistiklerine cebinizde ulaşabilirsiniz.`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:items-start lg:py-8">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <main className="min-w-0">
          {/* Pass the homepageAboutSeoText as a prop to MainContent */}
          <MainContent
            sidebarAboutSeoText={sidebarAboutSeoText}
            homepageAboutSeoText={homepageAboutSeoText}
          />
        </main>
      </div>
    </div>
  );
}
