import { getEnvStatus } from "@/lib/env-status";

declare global {
  // eslint-disable-next-line no-var
  var __envValidatedOnce: boolean | undefined;
}

/**
 * Runs a lightweight env validation once per process.
 * Never throws (must not crash production).
 */
export function ensureEnvValidatedOnce() {
  if (globalThis.__envValidatedOnce) return;
  globalThis.__envValidatedOnce = true;

  try {
    const status = getEnvStatus();
    if (!status.ok) {
      const missing = status.checks
        .filter((c) => c.severity === "required" && !c.valid)
        .map((c) => c.key);
      // eslint-disable-next-line no-console
      console.warn("[env] Missing/invalid required env:", missing.join(", "));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[env] Validation failed:", e);
  }
}

