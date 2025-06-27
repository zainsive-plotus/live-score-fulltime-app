import { Suspense } from 'react'; // <-- IMPORT Suspense
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { HeaderSkeleton, SidebarSkeleton } from '@/components/LayoutSkeletons'; // <-- IMPORT Skeletons

export default async function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        
        {/* --- THE FIX --- */}
        {/* Wrap the Sidebar in a Suspense boundary */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <main className="min-w-0">
          <MainContent />
        </main>
        
      </div>
    </div>
  );
}