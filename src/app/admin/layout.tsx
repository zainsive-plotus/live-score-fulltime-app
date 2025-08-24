import NextAuthProvider from "../NextAuthProvider";
import Providers from "../providers";
import "../globals.css";
import { Suspense } from "react";

// This is the root layout for ALL /admin routes.
// It provides context but does NOT perform authentication checks.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <NextAuthProvider>
        <Providers>{children}</Providers>
      </NextAuthProvider>
    </Suspense>
  );
}
