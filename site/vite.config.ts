import { defineConfig } from "vite";

// allowedHosts: true permits any Host header — fine for local dev,
// needed so tunnels (e.g. trycloudflare.com) aren't blocked.
export default defineConfig({
  server: {
    allowedHosts: true,
  },
});
