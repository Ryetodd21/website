/**
 * Wave 3 fix #12: single source of truth for oklch color values used in
 * Recharts (which can't read CSS variables directly) and any other JSX
 * context that needs raw color strings. The values mirror globals.css
 * editorial canvas + Okabe-Ito palette — when globals.css bumps a token,
 * update here too so charts and chrome stay in sync.
 *
 * Pattern matches the audit's recommendation: avoid hardcoded `oklch(...)`
 * literals scattered across dashboard pages that silently drift when
 * design tokens change.
 */

export const palette = {
  // ─── Editorial canvas (mirror globals.css) ──────────────────────────────
  paper: "oklch(0.985 0.005 80)",
  ink: "oklch(0.18 0.01 260)",
  /** Soft hairline used for chart grids + axis lines (current Round 9 value). */
  hairline: "oklch(0.91 0.004 80)",
  /** Muted ink for chart tick labels. */
  muted: "oklch(0.48 0.012 260)",

  // ─── Okabe-Ito brand (semantic) ────────────────────────────────────────
  primary: "oklch(0.577 0.245 27.325)", // Tailwind red-600 — active/brand
  success: "oklch(0.55 0.14 175)", // teal 175° — completed (NOT green)
  warning: "oklch(0.72 0.16 80)", // amber 80° — in-progress
  destructive: "oklch(0.55 0.22 340)", // fuchsia 340° — error/danger (NOT red)
  info: "oklch(0.58 0.14 220)", // cyan 220°
} as const;

/**
 * Cluster palette — used by `clusterDotColor()` and chart series.
 * Ordered by Okabe-Ito cluster semantics: Rendah (low/distraction = safe teal),
 * Sedang (medium = amber), Tinggi (high = fuchsia), overflow (info cyan).
 */
export const clusterPalette = [
  palette.success,
  palette.warning,
  palette.destructive,
  palette.info,
] as const;