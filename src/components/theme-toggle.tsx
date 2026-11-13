"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "monitor-ung-theme";

function readStored(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  root.classList.toggle("dark", resolved === "dark");
  // Also expose resolved theme for any CSS that wants to react.
  root.dataset.theme = resolved;
  root.dataset.themePreference = theme;
}

// useSyncExternalStore primitives. Re-runs on every cross-tab 'storage' event
// so multiple ThemeToggle instances (header + footer) stay in sync. The
// subscribe callback also re-applies the theme when the OS-level preference
// flips while the user is on "system".
function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readStored() === "system") applyTheme("system");
    callback();
  };
  window.addEventListener("storage", onStorage);
  mq.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    mq.removeEventListener("change", onSystemChange);
  };
}

function getSnapshot(): Theme {
  return readStored();
}

function getServerSnapshot(): Theme {
  // The inline THEME_INIT_SCRIPT in <head> applies the real value before
  // React hydrates, so SSR/CSR see the same thing on first render.
  return "system";
}

// Floating variant — fixed bottom-right, like a back button. The fixed
// positioning means it stays visible while scrolling, so the user can change
// theme without scrolling back to the header. Mirrors the editorial
// back-button aesthetic (square corners, hairline border, soft shadow) but
// floats above page content rather than living inline.
const FLOATING_CLASS =
  "fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center " +
  "bg-paper border border-hairline shadow-[var(--shadow-card-hover)] " +
  "text-ink/65 hover:text-ink hover:border-ink " +
  "transition-all duration-200 active:scale-95 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function ThemeToggle({
  compact = false,
  floating = false,
}: {
  compact?: boolean;
  /**
   * If true, the toggle floats fixed at bottom-right (visible across all
   * scroll positions, doesn't compete with header for space). When `floating`
   * is true, `compact` is ignored.
   */
  floating?: boolean;
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const cycle = () => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    applyTheme(next);
    // Manually notify this tab's useSyncExternalStore subscribers — the
    // 'storage' event only fires across tabs, not in the writing tab.
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light"
      ? "Tema terang"
      : theme === "dark"
        ? "Tema gelap"
        : "Mengikuti sistem";

  if (floating) {
    return (
      <button
        type="button"
        onClick={cycle}
        aria-label={`Ganti tema, saat ini: ${label}`}
        title={`${label}, klik untuk ganti`}
        className={FLOATING_CLASS}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </button>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={cycle}
        aria-label={`Ganti tema, saat ini: ${label}`}
        title={`${label}, klik untuk ganti`}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Ganti tema, saat ini: ${label}`}
      title={`${label}, klik untuk ganti`}
      className="inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold text-ink/65 hover:text-ink transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/**
 * The inline script that runs BEFORE React hydrates to apply the persisted
 * theme to <html>. Prevents flash-of-wrong-theme on initial paint.
 *
 * Render this via <head> in the root layout. It's a string so Next.js can
 * emit it at build time without a client bundle hop.
 */
export const THEME_INIT_SCRIPT = `
(function(){try{
var k='${STORAGE_KEY}';
var t=localStorage.getItem(k);
if(t!=='light'&&t!=='dark'&&t!=='system') t='system';
var sys=window.matchMedia('(prefers-color-scheme: dark)').matches;
var r=t==='system'?(sys?'dark':'light'):t;
var r2=document.documentElement;
r2.classList.toggle('dark', r=='dark');
r2.dataset.theme=r;
r2.dataset.themePreference=t;
}catch(e){}})();
`.trim();
