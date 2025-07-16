// ===== src/app/page.tsx =====

import { redirect } from "next/navigation";

const DEFAULT_LOCALE = "tr";

export default function RootPage() {
  // This page only redirects to the default locale.
  // The actual homepage content is handled by `src/app/[locale]/page.tsx`.
  // The middleware will handle locale detection for other languages.
  redirect(`/${DEFAULT_LOCALE}`);
}
