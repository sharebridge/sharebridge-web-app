import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Old Android tablets (Chrome 49+) — donor neighbourhood dashboard.
      targets: ["chrome >= 49", "android >= 5", "ios >= 10"],
      modernPolyfills: true
    })
  ],
  build: {
    target: "es2018"
  },
  server: {
    port: 5173
  }
});
