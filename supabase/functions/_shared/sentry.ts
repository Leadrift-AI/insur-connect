// Import Deno's Sentry SDK (you'll need to add this to import_map.json)
import * as Sentry from "https://deno.land/x/sentry@7.77.0/index.js";

let initialized = false;

export function initSentry() {
  if (initialized) return;

  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) {
    console.log("Sentry DSN not found, skipping initialization");
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });

  initialized = true;
  console.log("Sentry initialized for edge function");
}

export function withSentry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  functionName: string
) {
  return async (...args: T): Promise<R> => {
    initSentry();

    const req = args[0] as Request;
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const startTime = Date.now();

    // Set Sentry context
    Sentry.setTag('request_id', requestId);
    Sentry.setTag('function_name', functionName);

    console.log(JSON.stringify({
      message: "Function started",
      request_id: requestId,
      function: functionName,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    }));

    try {
      const result = await fn(...args);
      const latencyMs = Date.now() - startTime;

      console.log(JSON.stringify({
        message: "Function completed",
        request_id: requestId,
        function: functionName,
        latency_ms: latencyMs,
        status: "success",
        timestamp: new Date().toISOString()
      }));

      return result;
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      console.error(JSON.stringify({
        message: "Function error",
        request_id: requestId,
        function: functionName,
        latency_ms: latencyMs,
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString()
      }));

      // Send error to Sentry
      Sentry.captureException(error, {
        tags: {
          request_id: requestId,
          function_name: functionName,
          latency_ms: latencyMs
        }
      });

      throw error;
    }
  };
}