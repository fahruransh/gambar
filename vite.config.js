import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ["src/**/*.test.js"],
  },
});
