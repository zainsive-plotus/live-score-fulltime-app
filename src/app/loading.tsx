// src/app/loading.tsx
// This file acts as the server-side container for our client-side preloader.

import LottiePreloader from "@/components/LottiePreloader"; // Import the new component

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark">
      {/* 
        We render the LottiePreloader component here. 
        Next.js will handle rendering the client component within this server component shell.
      */}
      <LottiePreloader />
    </div>
  );
}
