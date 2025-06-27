// src/app/NextAuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";

// This is a new wrapper component
export default function NextAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}