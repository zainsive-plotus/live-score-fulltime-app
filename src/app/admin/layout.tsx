// ===== src/app/admin/layout.tsx =====

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import NextAuthProvider from "../NextAuthProvider";
import Providers from "../providers";
import "../globals.css";

export const metadata = {
  title: "FanSkor Admin Panel",
  description: "Management dashboard for FanSkor.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/login?error=Forbidden");
  }

  // --- START OF FIX ---
  // We return the providers and divs directly, without the <html> and <body> tags.
  // The RootLayout at src/app/layout.tsx already provides those.
  return (
    <NextAuthProvider>
      <Providers>
        <div className="flex min-h-screen bg-brand-dark">
          {" "}
          {/* Moved bg color here */}
          <AdminSidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </Providers>
    </NextAuthProvider>
  );
  // --- END OF FIX ---
}
