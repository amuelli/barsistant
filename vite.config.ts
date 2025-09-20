import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  build: {
    // Extra safeguard: disable aggressive chunking heuristics for these libs
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("preact") || id.includes("@preact/signals")) {
            return "preact-signals";
          }
        },
      },
    },
  },
});
