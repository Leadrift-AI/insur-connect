// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    server: {
      host: "0.0.0.0", // friendlier than "*"
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      isProd &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          // tag releases so events group correctly
          release: { name: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA },
          // (optional) silence plugin telemetry
          telemetry: false,
        }),
    ].filter(Boolean),
    build: {
      // required for source maps to be uploaded
      sourcemap: isProd,
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  };
});
