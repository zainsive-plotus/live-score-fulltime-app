// ===== src/app/[...not-found]/page.tsx (UPDATED) =====
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import Loading from "@/app/[locale]/loading"; // Reuse your existing loading screen
import ReferrerTracker from "@/components/ReferrerTracker";

// This component's only job is to redirect to the proper, localized 404 page.
export default function NotFoundCatchAll() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // We construct the URL for our canonical 404 page.
    // The middleware ensures that if a user has a language cookie (e.g., 'en'),
    // the initial bad request is already redirected to /en/ajdasld.
    // This component catches it and redirects to the clean /en/404 page.
    // For users without a cookie, it defaults to the TR locale.

    // Simple logic: Extract locale from path if present, otherwise default.
    const targetLocale = DEFAULT_LOCALE; // Always redirect non-prefixed bad URLs to the default locale's 404 page.

    // Use replace so the bad URL isn't in the user's browser history.
    router.replace(`/${targetLocale}/404`);
  }, [router, pathname]);

  // While the redirect is happening, show the user your standard loading screen.
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <Loading />
      <ReferrerTracker />
    </div>
  );
}
