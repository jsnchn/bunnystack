import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "./",
  root: ".",
  build: {
    outDir: "dist-web",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});