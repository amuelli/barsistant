import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  define: {
    // Polyfill Node.js global for packages that expect it
    global: "globalThis",
  },
  build: {
    rollupOptions: {
      // Externalize packages with CommonJS/ESM issues in Deno
      external: [
        /^@vercel\/oidc/,
        /^@ai-sdk\/gateway/,
        /^node-vibrant/,
        /^@vibrant\//,
        /^pngjs/,
        /^sharp/,
      ],
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
