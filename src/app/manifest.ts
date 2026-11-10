import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CampusMarket KE",
    short_name: "CampusMarket",
    description: "Buy, sell and discover good finds around campus in Kenya.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafbf8",
    theme_color: "#287d16",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
