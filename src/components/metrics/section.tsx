import type { ReactNode, CSSProperties } from "react";

// ─── Editorial Panel ──────────────────────────────────────────────────────
// Flat paper surface. Round 9: a subtle lift-1 shadow replaces the old
// flat hairline-only card so cards read as paper floating above paper
// without abandoning the editorial palette. The shadow is the only separator
// (hairline border dropped from the panel itself; hairline still used
// inside cards for table rows / list dividers via .divider-soft).

// Editorial Softened: GlassCard now uses gradient-panel-fill for subtle warmth.
export function GlassCard({
  children,
  className = "",
  style,
  delay = 0,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Stagger delay in ms for entrance animation */
  delay?: number;
  /** Adds hover affordance for clickable panels */
  interactive?: boolean;
}) {
  return (
    <div
      className={`editorial-panel overflow-hidden lift-1 gradient-panel-fill ${interactive ? "cursor-pointer transition-shadow" : ""} ${className}`}
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────
// Editorial treatment: eyebrow caps + display-serif title + optional right
// slot. Hairline rule under the title keeps sections visually distinct.

export function SectionHeader({
  title,
  sub,
  right,
  number,
  titleIcon,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  /** Optional eyebrow number prefix, e.g. "01" */
  number?: string;
  /** Inline icon next to the title (e.g. settings cog for config sections). */
  titleIcon?: ReactNode;
}) {
  return (
    // Round 9 — softer padding + inner highlight so the section header
    // feels like a paper label pressed into the card, not a hard slab.
    <div className="px-5 pt-5 pb-4 relative">
      {/* Decorative 1px highlight line — purely visual, carries no content. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-ink/[0.04] dark:bg-paper/[0.04]"
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {number && (
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="eyebrow-sm tabular-nums text-ink">{number}</span>
              <span className="eyebrow-sm text-ink/45">Bagian</span>
            </div>
          )}
          <h2 className="display-sans text-lg text-ink leading-tight flex items-center gap-2">
            <span className="min-w-0">{title}</span>
            {titleIcon}
          </h2>
          {sub && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-prose">{sub}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────
// Editorial replacement: just a colored dot + uppercase label, no pill
// background. Used sparingly — mostly inline with section content.

export type StatusType = "completed" | "training" | "active" | "inactive" | "warning" | "failed";

const dotClass: Record<StatusType, string> = {
  completed: "bg-success",
  training: "bg-warning",
  active: "bg-primary",
  // Round 30 audit (P2): inactive dot was bg-hairline (oklch 0.91) which
  // is too close to the page background --paper (oklch 0.985) — contrast
  // ~1.3:1, below the 3:1 minimum for non-text UI components. Use ink/30
  // instead (oklch ~0.55 in light mode, ~0.65 in dark) for clear separation.
  inactive: "bg-ink/30",
  warning: "bg-warning",
  failed: "bg-destructive",
};

export function StatusBadge({
  type,
  label,
}: {
  type: StatusType;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card px-2.5 py-1 text-xs font-medium text-ink"
    >
      <span aria-hidden="true" className={`inline-flex size-2 shrink-0 rounded-full ${dotClass[type]}`} />
      {label}
    </span>
  );
}
