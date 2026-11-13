import type { ReactNode } from "react";

// ─── Editorial Cluster Badge ───────────────────────────────────────────
// Replaces the old `clusterColor()` functions that returned tinted pill
// classes like "bg-teal-100 text-teal-700". This is the editorial
// treatment: a colored dot + uppercase text, no filled background.
// Used in: students, logs, monitoring, models pages.

export function ClusterBadge({
  cluster,
  className = "",
}: {
  cluster: string | null;
  className?: string;
}) {
  const config = clusterConfig(cluster);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-hairline bg-card px-2.5 py-1 text-xs font-medium ${config.color} ${className}`}>
      <span aria-hidden="true" className={`inline-flex size-2 shrink-0 rounded-full ${config.dot}`} />
      {cluster || "Belum dinilai"}
    </span>
  );
}

function clusterConfig(cluster: string | null): { color: string; dot: string } {
  if (!cluster) return { color: "text-muted-foreground", dot: "bg-muted-foreground" };
  if (cluster.includes("Rendah"))
    return { color: "text-success", dot: "bg-success" };
  if (cluster.includes("Tinggi"))
    return { color: "text-destructive", dot: "bg-destructive" };
  if (cluster.includes("Sedang")) return { color: "text-ink", dot: "bg-warning" };
  return { color: "text-ink", dot: "bg-primary" };
}

// ─── Editorial Tinted Pill ─────────────────────────────────────────────
// Replaces filled pill badges like "bg-teal-100 text-teal-700" with an
// editorial dot + uppercase label pattern.

export type EditorialPillType = "teal" | "amber" | "fuchsia" | "blue" | "ink";

const pillConfig: Record<EditorialPillType, { color: string; dot: string }> = {
  teal:    { color: "text-success",     dot: "bg-success" },
  amber:   { color: "text-warning",     dot: "bg-warning" },
  fuchsia: { color: "text-destructive", dot: "bg-destructive" },
  blue:    { color: "text-ink",     dot: "bg-primary" },
  ink:     { color: "text-ink",         dot: "bg-ink" },
};

export function EditorialPill({
  type = "ink",
  label,
  className = "",
}: {
  type?: EditorialPillType;
  label: ReactNode;
  className?: string;
}) {
  const { color, dot } = pillConfig[type] ?? pillConfig.ink;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${color} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
