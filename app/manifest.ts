import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smartables",
    short_name: "Smartables",
    description:
      "Mai più tavoli vuoti. Trasforma le chiamate perse in prenotazioni confermate.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF9710",
    orientation: "portrait",
    lang: "it",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    screenshots: [
      {
        src: "/dashboard-showcase.png",
        sizes: "1280x800",
        type: "image/png",
        // @ts-expect-error – form_factor is a valid PWA field not yet in TS types
        form_factor: "wide",
      },
      {
        src: "/app-showcase.png",
        sizes: "390x844",
        type: "image/png",
        // @ts-expect-error – form_factor is a valid PWA field not yet in TS types
        form_factor: "narrow",
      },
    ],
  };
}
