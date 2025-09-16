// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";
  const hasSentry =
    !!process.env.SENTRY_AUTH_TOKEN &&
    !!process.env.SENTRY_ORG &&
    !!process.env.SENTRY_PROJECT;

  const plugins: any[] = [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean);

  if (isProd && hasSentry) {
    try {
      const { sentryVitePlugin } = await import("@sentry/vite-plugin");
      plugins.push(
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: { name: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA },
          telemetry: false,
        })
      );
    } catch (err) {
      console.warn("[vite] Sentry plugin unavailable; skipping sourcemap upload");
    }
  } else if (isProd && !hasSentry) {
    console.warn("[vite] Sentry env missing; skipping sourcemap upload");
  }

  return {
    server: { host: "0.0.0.0", port: 8080 },
    plugins,
    build: { sourcemap: isProd },
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});