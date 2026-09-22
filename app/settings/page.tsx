"use client";

import { useRouter } from "next/navigation";
import { Bell, Info, LayoutDashboard, LifeBuoy, LogOut, MessageSquare, Moon, ShieldCheck, ShieldEllipsis, User } from "lucide-react";
import { Page, Row, RowGroup, SubHeader } from "@/components/ui";
import { api, useApi } from "@/lib/client";

export default function SettingsPage() {
  const router = useRouter();
  // the server decides who the owner is (hardcoded email); the row is simply not shown to anyone else
  const acc = useApi<{ account: { isOwner?: boolean } }>("/api/account");
  async function logout() { await api("/api/auth/logout", { method: "POST" }).catch(() => null); router.push("/login"); router.refresh(); }
  return (
    <Page>
      <SubHeader title="Settings" backHref="/menu" />
      <RowGroup>
        <Row icon={<User size={20} />} title="Account" sub="Profile, email, password and username" href="/settings/account" />
        <Row icon={<ShieldCheck size={20} />} title="Privacy & Security" sub="Private account, blocked users, 2FA" href="/settings/privacy" />
        <Row icon={<Bell size={20} />} title="Notifications" sub="Choose what you want to be notified about" href="/settings/notifications" />
        <Row icon={<Moon size={20} />} title="Appearance" sub="Dark or light mode" href="/settings/appearance" />
        <Row icon={<MessageSquare size={20} />} title="Messages" sub="Read receipts and online status" href="/settings/messages" />
        <Row icon={<ShieldEllipsis size={20} />} title="Security Center" sub="See and manage your sessions" href="/security" />
        <Row icon={<Info size={20} />} title="About" sub="Version, terms, privacy policy, guidelines" href="/settings/about" />
        <Row icon={<LifeBuoy size={20} />} title="Help & Support" sub="Get help from our team" href="/support" />
        {acc.data?.account.isOwner && <Row icon={<LayoutDashboard size={20} />} title="Admin" sub="Control Center — users, coins, tasks, news" href="/admin" />}
      </RowGroup>
      <div className="mt-4"><RowGroup><Row icon={<LogOut size={20} />} title="Logout" danger onClick={logout} right={<span />} /></RowGroup></div>
    </Page>
  );
}
