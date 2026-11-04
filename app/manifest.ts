import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مكتبہ الزھراء",
    short_name: "الزھراء",
    description: "مكتبہ الزھراء — کتب، آرڈرز اور بل کا انتظام",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ur",
    background_color: "#ffffff",
    theme_color: "#065f46",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "آرڈرز",
        short_name: "آرڈرز",
        url: "/orders",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "بارکوڈ سکین",
        short_name: "سکین",
        url: "/scan",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "کم سٹاک",
        short_name: "کم سٹاک",
        url: "/low-stock",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "کتب",
        short_name: "کتب",
        url: "/books",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}