import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type ErrorType = "unhandled_rejection" | "permission_denied" | "async_error" | "render_error" | "network_error";

interface ErrorLogPayload {
  error_type: ErrorType;
  error_message: string;
  error_stack?: string;
  route: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

// Debounce duplicate errors (same message within 5s)
const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000;
const MAX_QUEUE = 20;

const isDuplicate = (key: string): boolean => {
  const now = Date.now();
  const last = recentErrors.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentErrors.set(key, now);
  // Prune old entries
  if (recentErrors.size > 50) {
    for (const [k, v] of recentErrors) {
      if (now - v > DEDUP_WINDOW_MS) recentErrors.delete(k);
    }
  }
  return false;
};

// Queue for batching writes
let queue: ErrorLogPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushQueue = async () => {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_QUEUE);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    const rows = batch.map((entry) => ({
      user_id: userId,
      error_type: entry.error_type,
      error_message: entry.error_message?.slice(0, 2000) || null,
      error_stack: entry.error_stack?.slice(0, 4000) || null,
      route: entry.route?.slice(0, 500) || null,
      context: entry.context?.slice(0, 500) || null,
      user_agent: navigator.userAgent?.slice(0, 500) || null,
      metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : {},
    }));

    await supabase.from("frontend_error_logs").insert(rows as any);
  } catch (e) {
    // Silently fail — telemetry must never break the app
    console.warn("[Telemetry] Failed to flush error logs:", e);
  }
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, 2000);
};

/**
 * Log an error to the telemetry system.
 * Can be called from anywhere — it batches and deduplicates automatically.
 */
export const logError = (payload: ErrorLogPayload) => {
  const dedupeKey = `${payload.error_type}:${payload.error_message}`;
  if (isDuplicate(dedupeKey)) return;

  queue.push(payload);
  if (queue.length >= MAX_QUEUE) {
    void flushQueue();
  } else {
    scheduleFlush();
  }
};

/**
 * Hook that captures unhandled promise rejections and runtime errors,
 * enriching them with the current route path.
 */
export function useErrorTelemetry() {
  const location = useLocation();
  const routeRef = useRef(location.pathname);

  useEffect(() => {
    routeRef.current = location.pathname;
  }, [location.pathname]);

  const captureError = useCallback(
    (error: unknown, type: ErrorType, context?: string) => {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      logError({
        error_type: type,
        error_message: message,
        error_stack: stack,
        route: routeRef.current,
        context,
      });
    },
    []
  );

  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureError(event.reason, "unhandled_rejection", "global listener");
      event.preventDefault();
    };

    const onError = (event: ErrorEvent) => {
      captureError(event.error || event.message, "async_error", `${event.filename}:${event.lineno}`);
      if (event.cancelable) event.preventDefault();
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
      // Flush remaining on unmount
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      void flushQueue();
    };
  }, [captureError]);

  return { captureError, logError };
}
