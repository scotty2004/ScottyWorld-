import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isOwnerAccount } from "@/lib/admin/owner";
import { AdminShell } from "@/components/admin/admin-shell";

// Only the hardcoded owner account (lib/admin/owner.ts) can open the Control Center.
export default async function AdminLayout({children}:{children:React.ReactNode}) {
  const user=await getCurrentUser();
  if(!user || !isOwnerAccount(user)) redirect("/dashboard");
  return <AdminShell>{children}</AdminShell>;
}
