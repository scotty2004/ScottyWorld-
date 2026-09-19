import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

const allowed = new Set(["SUPER_ADMIN","ADMIN","MODERATOR","SUPPORT","CONTENT_MANAGER","FINANCE_MANAGER"]);

export default async function AdminLayout({children}:{children:React.ReactNode}) {
  const user=await getCurrentUser();
  if(!user || !allowed.has(user.role)) redirect("/dashboard");
  return <AdminShell>{children}</AdminShell>;
}
