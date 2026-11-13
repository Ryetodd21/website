"use client";

import { useEffect, useState } from "react";
import { getSystemStatus } from "./api";

/**
 * Wave 3 fix #11: read app version from `/api/status` instead of hardcoding
 * it in login/landing/changelog. Module-level cache ensures the status
 * endpoint is hit at most once per session even if multiple components
 * subscribe. Falls back to a build-time constant if the fetch fails (e.g.
 * server unreachable at mount) so SSR/CSR render the same value.
 *
 * Pattern matches the audit's `useUserProfile()` / `useInstitution()` style
 * but is intentionally lighter — no provider, just a hook with a Promise
 * cache. The version rarely changes, so the extra layer isn't warranted.
 */
let cachedVersion: string | null = null;
let inflight: Promise<void> | null = null;

export function useVersion(fallback: string): string {
  const [version, setVersion] = useState<string>(cachedVersion ?? fallback);
  useEffect(() => {
    if (cachedVersion) return;
    if (!inflight) {
      inflight = getSystemStatus()
        .then((s) => {
          const v = s?.server?.version;
          if (v) cachedVersion = `v${v}`;
        })
        .catch(() => {
          /* Keep fallback — server unreachable at mount is recoverable on next render. */
        });
    }
    inflight
      .then(() => setVersion(cachedVersion ?? fallback))
      .catch(() => undefined);
  }, [fallback]);
  return version;
}