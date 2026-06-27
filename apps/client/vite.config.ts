import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["plotly.js/dist/plotly", "react-plotly.js"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/evidence": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
