import { useEffect } from "react";

const ERROR_LOG_KEY = "error_logs";
const MAX_ERROR_LOGS = 50;

interface RuntimeErrorLog {
  timestamp: string;
  route: string;
  error: string;
  stack?: string;
  source: "window.error" | "unhandledrejection";
}

function appendRuntimeError(log: RuntimeErrorLog) {
  try {
    const prev = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || "[]");
    prev.unshift(log);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(prev.slice(0, MAX_ERROR_LOGS)));
  } catch {
    // ignore storage failures
  }
}

function normalizeReason(reason: unknown): { message: string; stack?: string } {
  if (reason instanceof Error) {
    return { message: reason.message, stack: reason.stack };
  }

  if (typeof reason === "string") {
    return { message: reason };
  }

  return { message: "Erro assíncrono desconhecido" };
}

export function useRuntimeGuards() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const normalized = normalizeReason(event.reason);

      appendRuntimeError({
        timestamp: new Date().toISOString(),
        route: window.location.pathname,
        error: normalized.message,
        stack: normalized.stack,
        source: "unhandledrejection",
      });

      console.error("[RuntimeGuard] Unhandled rejection:", event.reason);
      event.preventDefault();
    };

    const handleWindowError = (event: ErrorEvent) => {
      appendRuntimeError({
        timestamp: new Date().toISOString(),
        route: window.location.pathname,
        error: event.message || "Erro inesperado de runtime",
        stack: event.error?.stack,
        source: "window.error",
      });

      console.error("[RuntimeGuard] Window error:", event.error ?? event.message);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
    };
  }, []);
}
