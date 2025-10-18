import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration for local development and the preview command.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Allow connections from other devices on the LAN.
    allowedHosts: ["assistant.joshgill.dev"], // Permit reverse-proxy access in production.
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: ["assistant.joshgill.dev"],
  },
});
