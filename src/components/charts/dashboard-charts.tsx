"use client";
import { clusterPalette } from "@/lib/palette";
import * as React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { EditorialTooltip, makeEditorialAdapter } from "./editorial-tooltip";
import { palette } from "@/lib/palette";


const screenTimeTooltip = makeEditorialAdapter((entry) => {
  const e = entry as { value?: unknown; name?: unknown };
  if (typeof e.value !== "number") return null;
  return {
    accent: palette.primary,
    label: "Waktu Layar",
    value: `${e.value} menit`,
    invertDelta: true,
  };
});

const clusterTrendTooltip = makeEditorialAdapter((entry) => {
  const e = entry as { name?: unknown; value?: unknown; color?: string };
  if (typeof e.value !== "number") return null;
  return {
    accent: e.color ?? palette.primary,
    label: String(e.name ?? ""),
    value: `${e.value} hasil`,
  };
});
export function ScreenTimeChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }} accessibilityLayer>
          <defs><linearGradient id="dashboard-screen-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--hairline)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={42} />
          <Tooltip content={screenTimeTooltip} cursor={{ stroke: "var(--primary)", strokeWidth: 1 }} />
          <Area type="monotone" name="Waktu layar (menit)" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#dashboard-screen-gradient)" dot={{ r: 3, fill: "var(--primary)" }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      <details className="mt-3 border-t border-hairline text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium text-ink">Lihat data waktu layar</summary><div className="overflow-x-auto"><table className="w-full text-left"><caption className="sr-only">Rata-rata waktu layar harian dalam menit</caption><thead><tr><th scope="col" className="py-2">Hari</th><th scope="col">Rerata (menit)</th></tr></thead><tbody>{data.map((row, index) => <tr key={index} className="border-t border-hairline"><th scope="row" className="py-2 font-normal">{row.label}</th><td>{row.value.toLocaleString("id-ID")}</td></tr>)}</tbody></table></div></details>
    </>
  );
}

export function ClusterTrendChart({ data }: { data: Array<{ label: string; cluster_counts: Record<string, number>; total?: number }> }) {
  const labels = Array.from(new Set(data.flatMap(row => Object.keys(row.cluster_counts)))).sort((a, b) => a.localeCompare(b, "id"));
  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }} barCategoryGap="25%" accessibilityLayer>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--hairline)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} width={42} />
          <Tooltip content={clusterTrendTooltip} cursor={{ fill: "var(--muted)" }} />
          <Legend iconType="circle" iconSize={10} formatter={label => <span className="text-muted-foreground">{label}</span>} wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
          {labels.map((label, index) => <Bar key={label} dataKey={row => row.cluster_counts[label] ?? 0} name={label} fill={`var(--chart-${index % 5 + 1})`} radius={[4, 4, 0, 0]} isAnimationActive={false} />)}
        </BarChart>
      </ResponsiveContainer>
      <details className="mt-3 border-t border-hairline text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium text-ink">Lihat data kelompok</summary><div className="overflow-x-auto"><table className="w-full text-left"><caption className="sr-only">Jumlah hasil pengelompokan menurut kelompok model</caption><thead><tr><th scope="col" className="py-2 pr-4">Periode</th>{labels.map(label => <th key={label} scope="col" className="px-3 py-2">{label}</th>)}</tr></thead><tbody>{data.map((row, index) => <tr key={index} className="border-t border-hairline"><th scope="row" className="py-2 pr-4 font-normal">{row.label}</th>{labels.map(label => <td key={label} className="px-3 py-2">{(row.cluster_counts[label] ?? 0).toLocaleString("id-ID")}</td>)}</tr>)}</tbody></table></div></details>
    </>
  );
}

const CLUSTER_PALETTE = [
  "oklch(0.577 0.245 27.325)",
  "oklch(0.55 0.14 175)",
  "oklch(0.72 0.16 80)",
  "oklch(0.55 0.22 340)",
  "oklch(0.58 0.14 220)",
];

export interface ClusterPoint {
  id?: string;
  pca_x: number;
  pca_y: number;
  cluster_label: number;
  full_name?: string;
  nim?: string;
}

export function ClusterScatterPlot({
  points,
  clusterLabels,
}: {
  points: ClusterPoint[];
  clusterLabels: Record<string, string>;
}) {
  if (points.length === 0) return null;
  const clusters = Array.from(new Set(points.map((p) => p.cluster_label))).sort();
  const datasets = clusters.map((c) => ({
    cluster: c,
    label: clusterLabels[String(c)] ?? `Klaster ${c}`,
    color: CLUSTER_PALETTE[c % CLUSTER_PALETTE.length],
    data: points
      .filter((p) => p.cluster_label === c)
      .map((p) => ({ x: p.pca_x, y: p.pca_y, name: p.full_name, nim: p.nim })),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 12, right: 16, left: -8, bottom: 12 }}>
        <CartesianGrid stroke="oklch(0.91 0.004 80)" />
        <XAxis
          type="number"
          dataKey="x"
          name="PC1"
          tick={{ fontSize: 10, fill: "oklch(0.48 0.012 260)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.91 0.004 80)" }}
          label={{ value: "PC1", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "oklch(0.48 0.012 260)" }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="PC2"
          tick={{ fontSize: 10, fill: "oklch(0.48 0.012 260)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.91 0.004 80)" }}
          label={{ value: "PC2", angle: -90, position: "insideLeft", fontSize: 10, fill: "oklch(0.48 0.012 260)" }}
        />
        <Tooltip
          content={(props) => {
            const p = (props.payload?.[0] as { payload?: { name?: string; nim?: string; x: number; y: number } })?.payload;
            return (
              <EditorialTooltip
                active={props.active}
                label="Mahasiswa"
                rows={[
                  { label: "Nama", value: p?.name ?? "Tanpa nama" },
                  { label: "NIM", value: p?.nim ?? "kosong" },
                  { accent: palette.primary, label: "PC1", value: (p?.x ?? 0).toFixed(3) },
                  { accent: palette.warning, label: "PC2", value: (p?.y ?? 0).toFixed(3) },
                ]}
              />
            );
          }}
          cursor={{ stroke: "oklch(0.577 0.245 27.325 / 0.4)", strokeWidth: 1 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {datasets.map(({ cluster, label, color, data }) => (
          <Scatter
            key={String(cluster)}
            name={label}
            data={data}
            fill={color}
            fillOpacity={0.75}
            stroke={color}
            strokeWidth={0.5}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function ReportsClusterBarChart({
  data,
  labels,
  customTooltip,
}: {
  data: Array<{ label: string; clusters: Record<string, number> }>;
  labels: string[];
  customTooltip?: React.ReactElement;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }} barGap={2} barCategoryGap="18%">
        <CartesianGrid stroke="oklch(0.91 0.004 80)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.48 0.012 260)" }} tickLine={false} axisLine={{ stroke: "oklch(0.91 0.004 80)" }} />
        <YAxis tick={{ fontSize: 11, fill: "oklch(0.48 0.012 260)" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={customTooltip} cursor={{ fill: "oklch(0.18 0.01 260 / 0.04)" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {labels.map((label, index) => (
          <Bar key={label} dataKey={row => row.clusters[label] ?? 0} name={label}
            fill={clusterPalette[index % clusterPalette.length]} radius={[2, 2, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportsScreenAreaChart({
  data,
  customTooltip,
}: {
  data: Array<{ label: string; avgScreenTime: number }>;
  customTooltip?: React.ReactElement;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.577 0.245 27.325)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="oklch(0.577 0.245 27.325)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(0.91 0.004 80)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.48 0.012 260)" }} tickLine={false} axisLine={{ stroke: "oklch(0.91 0.004 80)" }} />
        <YAxis tick={{ fontSize: 11, fill: "oklch(0.48 0.012 260)" }} tickLine={false} axisLine={false} />
        <Tooltip content={customTooltip} cursor={{ stroke: "oklch(0.577 0.245 27.325 / 0.4)", strokeWidth: 1 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Area type="monotone" dataKey="avgScreenTime" name="Avg Screen (min)" stroke="oklch(0.577 0.245 27.325)" strokeWidth={2} fill="url(#screenGrad)" dot={{ r: 3, fill: "oklch(0.577 0.245 27.325)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
