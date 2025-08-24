import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // This layout ONLY protects its children. If the user isn't an admin,
  // we redirect to the login page, which lives outside this layout group.
  if (!session || session.user.role !== "admin") {
    redirect("/admin/login?error=Forbidden");
  }

  // Authenticated admins see the full layout with the sidebar.
  return (
    <div className="flex min-h-screen bg-brand-dark">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
