import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function MyProfile() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  redirect(`/u/${user.username}`);
}
