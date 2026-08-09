import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // basicSsl() retiré : plus de HTTPS en dev
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: true,
    https: false,
  },
});