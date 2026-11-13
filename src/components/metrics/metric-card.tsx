import type { ElementType, ReactNode } from "react";
import { StatusBadge, type StatusType } from "./section";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Metric Card ─────────────────────────────────────────────────────────
// Editorial treatment — hairline-grid primitive. Designed to live inside a
// parent `grid gap-px bg-hairline` wrapper, which provides the only
// separator between cards (no per-card border).
//
//   · numbered eyebrow label
//   · display-serif value
//   · caption + optional status dot
// No icon badge, no colored fills, no rounded corners, no own border.
// Single accent (the number) carries weight; everything else is type and
// whitespace.
//
// Round 9.5 polish: subtle `lift-1` shadow so the card reads as paper pressed
// against paper (parent hairline grid is the divider, the shadow is the lift).
// Hover escalates to `lift-1:hover` for a touch of depth.

export function MetricCard({
  icon: Icon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  iconBg: _iconBg,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  iconColor: _iconColor,
  label,
  value,
  sub,
  badge,
  badgeType,
  delay = 0,
  number,
  pending = false,
}: {
  icon?: ElementType;
  /** Kept for backwards compatibility — ignored in editorial styling. */
  iconBg?: string;
  /** Kept for backwards compatibility — ignored in editorial styling. */
  iconColor?: string;
  label: string;
  value: ReactNode;
  sub?: string;
  badge?: string;
  badgeType?: StatusType;
  delay?: number;
  /** Optional eyebrow number prefix, e.g. "01" */
  number?: string;
  pending?: boolean;
}) {
  return (
    <div
      className="dashboard-metric p-5 w-full min-w-0 bg-card flex flex-col justify-between min-h-[164px]"
      style={{ animationDelay: `${delay}ms` }}
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          {number && (
            <span className="sr-only">
              {number}
            </span>
          )}
          <p className="text-sm font-medium text-muted-foreground break-words">{label}</p>
        </div>
        {badge && badgeType && <StatusBadge type={badgeType} label={badge} />}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <span className="mr-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" strokeWidth={1.8} aria-hidden="true" /></span>}
        {pending && value == null ? <Skeleton height={36} width="55%" aria-hidden="true" /> : <p className="font-mono text-2xl sm:text-3xl font-bold text-ink leading-tight tabular-nums min-w-0 break-words">{value ?? "Belum tersedia"}</p>}
      </div>
      {sub && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{pending ? "Memperbarui data..." : sub}</p>
      )}
    </div>
  );
}

// ─── Realtime Strip ─────────────────────────────────────────────────────
// Editorial inline pills. Used in headers for live counters — kept as
// compact horizontal rows instead of full panels.

export type RealtimeStat = {
  icon: ElementType;
  label: string;
  value: ReactNode;
  /** Kept for backwards compatibility — colour derived from value tone. */
  tint?: "emerald" | "blue" | "amber" | "violet" | "rose";
};

export function RealtimeStrip({ stats }: { stats: RealtimeStat[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 animate-fade-up border-y border-hairline py-3">
      {stats.map((s, i) => (
        <div key={i} className="flex items-baseline gap-2 min-w-0">
          <span className="eyebrow-sm tabular-nums text-ink/40 shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>
          {s.icon && (
            <s.icon className="h-3.5 w-3.5 text-ink/45 shrink-0 mb-0.5" strokeWidth={1.75} />
          )}
          <span className="display-sans text-base text-ink leading-none tabular-nums">
            {s.value}
          </span>
          <span className="text-[11px] text-ink/50 leading-none truncate">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
