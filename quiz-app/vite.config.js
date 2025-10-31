import { defineConfig } from "vite";
import tailwind from "@tailwindcss/vite";

// Minimal Vite config to enable Tailwind v4 via the official plugin
export default defineConfig({
  plugins: [tailwind()],
});


