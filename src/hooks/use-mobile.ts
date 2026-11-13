import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * useSyncExternalStore-based hook to read whether the viewport is narrower
 * than the mobile breakpoint. Subscribes to the `change` event of the
 * `max-width` media query so it re-renders only when the breakpoint is
 * crossed — not on every viewport resize.
 *
 * Returns `undefined` during SSR so callers can render a desktop-first
 * shell on the server and reveal the mobile UI only after hydration.
 */
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
