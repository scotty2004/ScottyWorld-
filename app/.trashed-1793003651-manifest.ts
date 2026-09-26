import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScottyWorld",
    short_name: "ScottyWorld",
    description: "One smart platform for tech, AI, developers, bots, learning, community and digital tools.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f8fc",
    theme_color: "#1d4fe8",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
