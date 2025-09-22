import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";
  const hasSentry =
    !!process.env.SENTRY_ORG &&
    !!process.env.SENTRY_PROJECT;
  const disableSentry = process.env.DISABLE_SENTRY_PLUGIN === "true";

  const plugins: any[] = [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean);

  if (isProd && hasSentry && !disableSentry) {
    const sentryModule = await import("@sentry/vite-plugin").catch(() => null);

    if (sentryModule?.sentryVitePlugin) {
      plugins.push(
        sentryModule.sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: { name: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA },
          telemetry: false,
        })
      );
    } else {
      console.warn("[vite] Sentry plugin unavailable; skipping sourcemap upload");
    }
  } else if (isProd && disableSentry) {
    console.warn("[vite] Sentry plugin disabled; skipping sourcemap upload");
  } else if (isProd && !hasSentry) {
    console.warn("[vite] Sentry env missing; skipping sourcemap upload");
  }

  return {
    server: { host: "::", port: 8080 },
    plugins,
    build: { sourcemap: true },
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
