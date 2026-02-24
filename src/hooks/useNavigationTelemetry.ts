import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface NavEvent {
  route: string;
  loadTimeMs: number;
  status: "ok" | "slow" | "timeout";
  timestamp: string;
}

const SLOW_THRESHOLD = 3000;
const TIMEOUT_THRESHOLD = 10000;
const MAX_LOGS = 50;
const STORAGE_KEY = "nav_telemetry";

export function useNavigationTelemetry() {
  const location = useLocation();
  const navStart = useRef(performance.now());

  useEffect(() => {
    navStart.current = performance.now();

    const timer = setTimeout(() => {
      console.warn(`[Telemetry] TIMEOUT on ${location.pathname} (>${TIMEOUT_THRESHOLD}ms)`);
    }, TIMEOUT_THRESHOLD);

    // Use rAF to detect when the route has painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clearTimeout(timer);
        const elapsed = Math.round(performance.now() - navStart.current);
        const status: NavEvent["status"] =
          elapsed > TIMEOUT_THRESHOLD ? "timeout" : elapsed > SLOW_THRESHOLD ? "slow" : "ok";

        const event: NavEvent = {
          route: location.pathname,
          loadTimeMs: elapsed,
          status,
          timestamp: new Date().toISOString(),
        };

        if (status !== "ok") {
          console.warn(`[Telemetry] ${status.toUpperCase()} ${location.pathname} ${elapsed}ms`);
        }

        try {
          const prev: NavEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          prev.unshift(event);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(0, MAX_LOGS)));
        } catch {}
      });
    });

    return () => clearTimeout(timer);
  }, [location.pathname]);
}

/** Read stored telemetry (useful for admin/debug pages) */
export function getNavigationTelemetry(): NavEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
