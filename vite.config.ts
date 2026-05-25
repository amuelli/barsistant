import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  define: {
    // Polyfill Node.js global for packages that expect it
    global: "globalThis",
  },
  ssr: {
    // ssr.external in Vite 7 uses Array.includes() — regexes are silently ignored.
    // Must use explicit string package names (regexes only work in build.rollupOptions.external).
    external: [
      "node-vibrant",
      "@vibrant/color",
      "@vibrant/core",
      "@vibrant/generator-default",
      "@vibrant/generator",
      "@vibrant/image-browser",
      "@vibrant/image-node",
      "@vibrant/image",
      "@vibrant/quantizer-mmcq",
      "@vibrant/quantizer",
      "@vibrant/types",
      "@vibrant/worker",
      "@jimp/bmp",
      "@jimp/core",
      "@jimp/custom",
      "@jimp/gif",
      "@jimp/jpeg",
      "@jimp/plugin-resize",
      "@jimp/png",
      "@jimp/tiff",
      "@jimp/types",
      "@jimp/utils",
      "pngjs",
    ],
  },
  build: {
    rollupOptions: {
      external: [
        /^@vercel\/oidc/,
        /^@ai-sdk\/gateway/,
        /^node-vibrant/,
        /^@vibrant\//,
        /^@jimp\//,
        /^pngjs/,
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
