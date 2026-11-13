"use client";
import { cn } from "@/lib/utils";

export interface EditorialTooltipRow {
  /** Colored dot indicator (CSS oklch literal or token). */
  accent?: string;
  /** Short label, e.g. "Waktu Layar" or "Rendah". */
  label: string;
  /** Value to display (already formatted). */
  value: string | number;
  /** Optional delta indicator — % change vs prior period. */
  delta?: number;
  /** Reverse the polarity (e.g. lower is better for "Distraction"). */
  invertDelta?: boolean;
}

export interface EditorialTooltipProps {
  active?: boolean;
  label?: string | number;
  rows?: EditorialTooltipRow[];
  /** Optional className for the wrapper. */
  className?: string;
}

function formatValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return v.toLocaleString("id-ID");
  if (typeof v === "string") return v;
  return String(v);
}

/**
 * Editorial chart tooltip: paper bg + hairline border + numbered eyebrow
 * + display-sans value + delta indicator. Use as Recharts `<Tooltip content={EditorialTooltip} />`
 * — pass `rows` after extracting from props.
 */
export function EditorialTooltip(props: EditorialTooltipProps) {
  const { active, label, rows, className } = props;
  if (!active) return null;
  return (
    <div
      className={cn(
        "bg-paper border border-hairline shadow-panel px-3 py-2.5 min-w-[180px] max-w-[260px]",
        "animate-fade-up",
        className,
      )}
    >
      {label != null && (
        <div className="eyebrow-sm text-ink/45 mb-1.5 tabular-nums">
          {typeof label === "number" ? label.toLocaleString("id-ID") : String(label)}
        </div>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-1">
          {rows.map((row, i) => {
            const deltaPositive = row.delta != null && row.delta > 0;
            const deltaNegative = row.delta != null && row.delta < 0;
            const good = row.invertDelta ? deltaNegative : deltaPositive;
            return (
              <div key={i} className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  {row.accent && (
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: row.accent }}
                    />
                  )}
                  <span className="text-xs text-ink/55 truncate">{row.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-sm text-ink tabular-nums font-medium">
                    {typeof row.value === "number"
                      ? row.value.toLocaleString("id-ID")
                      : row.value}
                  </span>
                  {row.delta != null && (
                    <span
                      className={cn(
                        "text-[10px] tabular-nums font-mono",
                        good ? "text-success" : deltaNegative ? "text-destructive" : "text-ink/45",
                      )}
                    >
                      {deltaPositive ? "+" : ""}
                      {row.delta.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Adapter: extract rows from Recharts payload and pass to EditorialTooltip.
 * Use as `<Tooltip content={screenTimeAdapter} />`.
 */
export function makeEditorialAdapter(buildRows: (entry: unknown) => EditorialTooltipRow | null) {
  return function Adapter(props: { active?: boolean; payload?: ReadonlyArray<unknown>; label?: string | number }) {
    const { active, payload, label } = props;
    if (!active) return null;
    const rows: EditorialTooltipRow[] = [];
    for (const e of payload ?? []) {
      const row = buildRows(e);
      if (row) rows.push(row);
    }
    return <EditorialTooltip active={active} label={label} rows={rows} />;
  };
}

export { formatValue };
