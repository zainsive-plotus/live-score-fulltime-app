"use client";

import { Suspense } from 'react'; // <-- IMPORT Suspense
import Link from 'next/link';
import Header from '@/components/Header';
import { HeaderSkeleton } from '@/components/LayoutSkeletons'; // <-- IMPORT Skeleton
import { Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <Frown className="w-16 h-16 text-text-muted mb-4" />
        <h1 className="text-4xl font-extrabold text-white">404 - Page Not Found</h1>
        <p className="text-lg text-text-secondary mt-2 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link 
            href="/"
            className="px-6 py-3 bg-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Go back to Homepage
        </Link>
      </main>
    </div>
  )
}