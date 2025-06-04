import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@Tenants": path.resolve(__dirname, "../server/src/tenants"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        // Allow Vite to serve files from outside the project root
        path.resolve(__dirname, "../.."),
      ],
    },
  },
});
