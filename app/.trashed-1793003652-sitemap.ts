import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://scottyworld.example").replace(/\/$/, "");
  const paths = [
    "/", "/pricing", "/about", "/login", "/register",
    "/ai", "/bots", "/developer", "/academy", "/news",
    "/marketplace", "/downloader", "/community", "/channels",
    "/support", "/faq", "/pro",
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
