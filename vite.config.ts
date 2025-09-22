import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean);

  if (!process.env.DISABLE_SENTRY_PLUGIN) {
    try {
      const mod = await import("@sentry/vite-plugin").catch(() => null);
      const sentryVitePlugin = (mod as any)?.sentryVitePlugin;
      if (sentryVitePlugin && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
        plugins.push(sentryVitePlugin({
          org: process.env.SENTRY_ORG!,
          project: process.env.SENTRY_PROJECT!,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: { name: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA },
          telemetry: false,
        }));
      } else {
        console.warn("[vite] Sentry plugin skipped (missing package or env).");
      }
    } catch {
      console.warn("[vite] Sentry plugin not available, continuing without it.");
    }
  } else {
    console.warn("[vite] Sentry plugin disabled via DISABLE_SENTRY_PLUGIN=1");
  }

  return {
    server: { host: "::", port: 8080 },
    plugins,
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 2500
    },
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});