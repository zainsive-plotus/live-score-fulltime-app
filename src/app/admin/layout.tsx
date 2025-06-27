// src/app/admin/layout.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { LanguageProvider } from "@/context/LanguageContext";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // 1. UNCOMMENT THIS BLOCK
  if (!session) {
    // Redirect to the login page with an error message indicating forbidden access
    redirect("/login?error=Forbidden");
  }

  // 2. If user is an admin, render the layout...
  return (
     <LanguageProvider>
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-brand-dark">
        {children}
      </main>
    </div>
    </LanguageProvider>
  );
}