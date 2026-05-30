import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Recomp Games",
        short_name: "Recomp",
        description: "Recomp Games — 26 weeks, 9 friends, one leaderboard.",
        theme_color: "#0b0f1a",
        background_color: "#0b0f1a",
        display: "standalone",
        start_url: "./#/app",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      // Default Workbox config precaches build assets (HTML/CSS/JS) only.
      // No runtime caching of Supabase responses — PLAN.md Phase 5 explicitly
      // defers that to keep the launch surface area small.
    }),
  ],
});
