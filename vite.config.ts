import { defineConfig } from "vite";

export default defineConfig({
  // Relative (not absolute) asset paths — GitHub Pages serves this as a
  // project site at /linkedinfut/, not the domain root, so "/assets/..."
  // 404s. "./assets/..." resolves correctly regardless of subpath depth.
  base: "./",
});
