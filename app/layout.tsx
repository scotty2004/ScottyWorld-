import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { getCurrentUser } from "@/lib/auth/session";

const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://scottyworld.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ScottyWorld — The All-in-One Tech Ecosystem", template: "%s | ScottyWorld" },
  description: "One smart platform for tech, AI, developers, bots, learning, community and digital tools.",
  applicationName: "ScottyWorld",
  keywords: ["ScottyWorld", "AI", "developers", "WhatsApp bots", "coding", "academy", "developer tools", "community"],
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "ScottyWorld", title: "ScottyWorld", description: "One smart platform for tech, AI, developers, bots, learning, community and digital tools.", url: siteUrl },
  twitter: { card: "summary_large_image", title: "ScottyWorld", description: "One smart platform for tech, AI, developers, bots, learning, community and digital tools." },
  category: "technology",
  appleWebApp: { capable: true, title: "ScottyWorld", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f8fc" }, { media: "(prefers-color-scheme: dark)", color: "#080d1b" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const u = await getCurrentUser().catch(() => null);
  const user = u ? { displayName: u.displayName, username: u.username, avatarUrl: u.profile?.avatarUrl ?? null } : null;
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppShell user={user}>{children}</AppShell>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
