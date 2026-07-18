import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          // Isolate the Firebase SDK into its own long-cached vendor chunk so an
          // app-code change doesn't force every visitor to re-download ~500 kB.
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
            "firebase/functions",
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
