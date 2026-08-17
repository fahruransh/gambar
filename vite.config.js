import { defineConfig } from "vite";

export default defineConfig({
  // Gunakan jalur relatif agar paket `dist` dapat diunggah ke domain utama
  // maupun ke subfolder hosting tanpa kehilangan CSS/JavaScript.
  base: "./",
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ["src/**/*.test.js"],
  },
});
