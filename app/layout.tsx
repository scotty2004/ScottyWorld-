import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { AppShell } from "../components/app-shell";
import { PwaRegister } from "@/components/pwa-register";

const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://scottyworld.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ScottyWorld",
    template: "%s | ScottyWorld",
  },
  description:
    "ScottyWorld — one smart platform for tech, AI, developers, bots, learning, community and digital tools.",
  applicationName: "ScottyWorld",
  keywords: [
    "ScottyWorld", "AI", "developers", "WhatsApp bots", "coding",
    "academy", "developer tools", "technology", "community"
  ],
  authors: [{ name: "ScottyWorld" }],
  creator: "ScottyWorld",
  publisher: "ScottyWorld",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: "ScottyWorld",
    title: "ScottyWorld",
    description:
      "One smart platform for tech, AI, developers, bots, learning, community and digital tools.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "ScottyWorld",
    description:
      "One smart platform for tech, AI, developers, bots, learning, community and digital tools.",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
