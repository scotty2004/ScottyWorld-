"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}