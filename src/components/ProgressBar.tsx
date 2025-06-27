"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress. This is optional.
    NProgress.configure({ showSpinner: false });

    // This effect will run when the pathname or search parameters change,
    // which signifies that a navigation has completed.
    NProgress.done();
    
    // Cleanup function
    return () => {
      NProgress.remove();
    };
  }, [pathname, searchParams]);
  
  // This component doesn't render anything itself. It just controls the NProgress bar.
  return null; 
}