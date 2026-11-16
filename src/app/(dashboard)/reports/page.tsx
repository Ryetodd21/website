"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  TrendingDown,
  Users,
  Clock,
  ActivitySquare,
  KeyRound,
  MessageCircle,
  Gamepad2,
  ArrowDownUp,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterChipBar } from "@/components/ui/filter-chip-bar";
const ReportsClusterBarChart = dynamic(
  () => import("@/components/charts/dashboard-charts").then((m) => m.ReportsClusterBarChart),
  { ssr: false, loading: () => <div className="h-[260px] bg-ink/[0.015] animate-pulse" /> }
);
const ReportsScreenAreaChart = dynamic(
  () => import("@/components/charts/dashboard-charts").then((m) => m.ReportsScreenAreaChart),
  { ssr: false, loading: () => <div className="h-[260px] bg-ink/[0.015] animate-pulse" /> }
);
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, SectionHeader, MetricCard, PageHeader } from "@/components/metrics";
import { AnimatedMetricValue } from "@/components/ui/animated-metric-value";
import { DownloadButton } from "@/components/ui/download-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { witaWeekRange } from "@/lib/report-dates";
import { useInstitution } from "@/lib/institution";
import {
  getScreenTimeTrends,
  getClusterTrends,
  getReport,
  getCurrentUser,
  getGeofenceSummary,
  type ScreenTimeTrend,
  type ClusterTrend,
  type ReportResponse,
  type GeofenceSummary,
} from "@/lib/api";

const CustomTooltip = ({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-paper border border-hairline px-3 py-2 text-xs">
      <p className="font-semibold text-ink mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-ink">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

  // Trend limits per period, matches user spec:
  //   chart: 7 days / 4 weeks / 3 months (compact view)
  //   detail: 14 days / 4 weeks / 3 months (broader recap table)
const CHART_LIMIT: Record<"daily" | "weekly" | "monthly", number> = {
    daily: 7,
    weekly: 4,
    monthly: 3,
  };
const DETAIL_LIMIT: Record<"daily" | "weekly" | "monthly", number> = {
    daily: 14,
    weekly: 4,
    monthly: 3,
  };


export default function ReportsPage() {
  const { profile: institutionProfile } = useInstitution();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [initialRange] = useState(() => witaWeekRange());
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [clusterFilter, setClusterFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [clusterLabels, setClusterLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [clusterTrends, setClusterTrends] = useState<ClusterTrend[]>([]);
  const [detailTrends, setDetailTrends] = useState<ClusterTrend[]>([]);
  const [screenTrends, setScreenTrends] = useState<ScreenTimeTrend[]>([]);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser> extends Promise<infer T | null> ? T | null : null>(null);
  const [geofence, setGeofence] = useState<GeofenceSummary | null>(null);
  // Rekap kehadiran mengikuti periode laporan (daily 7d / weekly 4w / monthly 3m).
  // Beda dengan dashboard yang hardcode 7 hari.
  // Bul.13: laporan terbaru di atas secara default, dengan opsi toggle
  // untuk membalik ke urutan terlama dulu. State `sortDescending`
  // mengontrol arah; default true (terbaru di atas).
  const [sortDescending, setSortDescending] = useState(true);

  useEffect(() => {
    getCurrentUser().then(u => { if (u) setCurrentUser(u); });
  }, []);

  // Period-aware unit word. Bul.11: hardcoded "hari" di MetricCard sub
  // menghasilkan label yang salah untuk periode Mingguan/Bulanan. Sekarang
  // pakai satu sumber yang sama dengan chart, filter, dan prosa.
  const periodWord = period === "daily" ? "hari" : period === "weekly" ? "minggu" : "bulan";

  const loadData = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    setError(null);
    setReportData(null);
    setClusterTrends([]);
    setDetailTrends([]);
    setScreenTrends([]);
    setGeofence(null);
    try {
      if (!startDate || !endDate || startDate > endDate) throw new Error("Rentang tanggal tidak valid");
      const geofenceDays = period === "daily" ? CHART_LIMIT.daily
        : period === "weekly" ? CHART_LIMIT.weekly * 7 : CHART_LIMIT.monthly * 30;
      const [screen, clusters, report, presence, detail] = await Promise.all([
        getScreenTimeTrends(CHART_LIMIT[period], signal),
        getClusterTrends(period, CHART_LIMIT[period], signal),
        getReport({ period, start_date: startDate, end_date: endDate,
          cluster: clusterFilter === "all" ? undefined : Number(clusterFilter), signal }),
        getGeofenceSummary(geofenceDays, signal),
        getClusterTrends(period, DETAIL_LIMIT[period], signal),
      ]);
      if (signal.aborted) return;
      setScreenTrends(screen.trends);
      setClusterTrends(clusters.trends);
      setReportData(report);
      setClusterLabels(report.cluster_labels ?? {});
      setGeofence(presence);
      setDetailTrends(detail.trends);
    } catch (err) {
      if (signal.aborted || (err instanceof Error && err.name === "RedirectError")) return;
      const message = err instanceof Error ? err.message : "Gagal memuat data laporan";
      setError(message);
      toast.error(message);
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, [period, startDate, endDate, clusterFilter]);

  useEffect(() => {
    // Clear stale results before starting the request for the new filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    const handleFilterChanged = () => {
      void loadData();
    };
    window.addEventListener("academic-filter-changed", handleFilterChanged);
    return () => {
      requestRef.current?.abort();
      window.removeEventListener("academic-filter-changed", handleFilterChanged);
    };
  }, [loadData]);

  const avgScreenTime = reportData?.avg_screen_time
    ? `${Math.floor(reportData.avg_screen_time / 60)}j ${Math.round(reportData.avg_screen_time % 60)}m`
    : "kosong";

  const totalStudents = reportData?.total_students ?? 0;
  const clusterCounts = reportData?.cluster_counts ?? {};

  const avgScore = reportData?.avg_distraction_score?.toFixed(3) ?? "kosong";
  const clusterNames = [...new Set([
    ...Object.values(clusterLabels),
    ...detailTrends.flatMap(trend => Object.keys(trend.cluster_counts ?? {})),
  ])];
  const clusterColumns = clusterNames.map(name => ({ key: `cluster:${name}`, label: name }));
  const chartData = clusterTrends.map(trend => ({ label: trend.label, clusters: trend.cluster_counts ?? {} }));

  const screenChartData = screenTrends.map(t => ({
    label: t.label,
    date: t.date,
    avgScreenTime: t.avg_duration_min,
    logCount: t.log_count,
  }));

  // Sort chronologically by start_date and rewrite the daily label from a
  // weekday abbreviation ("Sen", "Sel"…) to a real date ("12 Sep"). The
  // 14-day recap repeats weekday names and was the source of the "not in
  // order" feedback — using the date makes the order obvious at a glance.
  const monthShort = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  function formatRecapLabel(t: ClusterTrend): string {
    if (period === "daily" && (t as ClusterTrend & { start_date?: string }).start_date) {
      const d = new Date((t as ClusterTrend & { start_date: string }).start_date);
      if (!Number.isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, "0")} ${monthShort[d.getMonth() + 1]}`;
      }
    }
    return t.label;
  }

  const sortedDetailTrends = [...detailTrends].sort((a, b) => {
    const ad = (a as ClusterTrend & { start_date?: string }).start_date ?? "";
    const bd = (b as ClusterTrend & { start_date?: string }).start_date ?? "";
    if (ad && bd) {
      return sortDescending ? bd.localeCompare(ad) : ad.localeCompare(bd);
    }
    return 0;
  });

  const tableData = sortedDetailTrends.map(trend => ({
    label: formatRecapLabel(trend),
    date: trend.date ?? trend.label,
    total: trend.total,
    clusters: trend.cluster_counts ?? {},
    avgScore: trend.avg_distraction_score?.toFixed(3) ?? "kosong",
    avgScreen: period === "daily"
      ? screenTrends.find(screen => screen.date === (trend.start_date ?? trend.date))?.avg_duration_min ?? "kosong"
      : "kosong",
  }));

  return (
    <div className="space-y-0">
      {error && <div role="alert" className="border border-destructive p-4 flex flex-wrap gap-3 items-center">
        <p>{error}</p><Button onClick={() => void loadData()} disabled={loading}>Coba lagi</Button>
      </div>}
      {/* ─── Welcome Header ─── */}
      <PageHeader
        title="Laporan & Rekap"
        subtitle="Harian, mingguan, dan bulanan"
        showDate={false}
        connected={true}
        statusBadge={{ type: "active", label: "Sistem Aktif" }}
        rightActions={
          tableData.length > 0 ? (
            <DownloadButton
              filename={`laporan-${period}`}
              data={tableData.map(r => ({
                periode: r.label,
                total: r.total,
                ...Object.fromEntries(clusterNames.map(name => [`cluster:${name}`, r.clusters[name] ?? 0])),
                avg_screen_time_menit: r.avgScreen !== "kosong" ? r.avgScreen : undefined,
                avg_unlock_count: reportData?.avg_unlock_count,
                avg_social_media_time_menit: reportData?.avg_social_media_time,
                avg_game_time_menit: reportData?.avg_game_time,
                skor_distraksi: r.avgScore,
              }))}
              columns={[
                { key: "periode", label: "Periode" },
                { key: "total", label: "Total Mahasiswa" },
                ...clusterColumns,
                { key: "avg_screen_time_menit", label: "Rerata Screen Time (m)" },
                { key: "avg_unlock_count", label: "Rerata Unlock" },
                { key: "avg_social_media_time_menit", label: "Rerata Sosmed (m)" },
                { key: "avg_game_time_menit", label: "Rerata Game (m)" },
                { key: "skor_distraksi", label: "Skor Distraksi" },
              ]}
              title={`Laporan ${period.charAt(0).toUpperCase() + period.slice(1)} Distraksi`}
              institution={{ name: institutionProfile.universityName || "Universitas Negeri Gorontalo", faculty: institutionProfile.faculty, program: institutionProfile.program }}
              downloadedBy={currentUser ? { name: currentUser.full_name ?? currentUser.sub, role: currentUser.role, email: currentUser.email, nip: currentUser.nip } : undefined}
            />
          ) : undefined
        }
      />

      {/* ─── Metric Cards ─── */}
      <section className="border-t border-hairline">
        <div className="grid gap-px grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-full bg-hairline">
            <MetricCard
              icon={Users}
              label="Total Mahasiswa"
              value={<AnimatedMetricValue value={totalStudents} />}
              sub="Terdata di laporan"
              badge={loading ? "Memuat" : "Aktif"}
              badgeType={loading ? "warning" : "active"}
              number="01"
              delay={0}
            />
            <MetricCard
              icon={ActivitySquare}
              label="Skor Rata-rata"
              value={avgScore}
              sub="Skor tersimpan pada rentang terpilih"
              badge={avgScore === "kosong" ? "Belum dinilai" : "Hasil model"}
              badgeType={Number(avgScore) < 0.4 ? "completed" : Number(avgScore) < 0.65 ? "active" : "warning"}
              number="02"
              delay={80}
            />
            <MetricCard
              icon={Clock}
              label="Rerata Screen Time"
              value={avgScreenTime}
              sub={`Per ${periodWord}`}
              badge="Rata-rata"
              badgeType="warning"
              number="03"
              delay={160}
            />
            <MetricCard
              icon={TrendingDown}
              label="Distribusi Klaster"
              value={
                <span className="flex flex-wrap gap-2 text-sm">
                  {Object.entries(clusterCounts).map(([label, count]) => <span key={label}>{label}: {count}</span>)}
                </span>
              }
              sub="Label model aktif"
              badge="Update"
              badgeType="completed"
              number="04"
              delay={240}
            />
        </div>
        {/* Row kedua (Round 11): trio rerata unlock, sosmed, game yang
            datanya baru tersedia dari backend. Tetap 4 kolom pada lg agar
            card melengkapi row pertama tanpa overflow. */}
        <div className="grid gap-px grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-full bg-hairline">
            <MetricCard
              icon={KeyRound}
              label="Rerata Unlock Count"
              value={reportData?.avg_unlock_count != null ? <AnimatedMetricValue value={Number(reportData.avg_unlock_count)} decimals={1} /> : "kosong"}
              sub={`Per mahasiswa per ${periodWord}`}
              badge={reportData?.avg_unlock_count != null ? "Update" : "Siaga"}
              badgeType="active"
              number="05"
              delay={320}
            />
            <MetricCard
              icon={MessageCircle}
              label="Rerata Sosmed"
              value={
                reportData?.avg_social_media_time
                  ? `${Math.floor(reportData.avg_social_media_time / 60)}j ${Math.round(reportData.avg_social_media_time % 60)}m`
                  : "kosong"
              }
              sub={`Waktu buka per ${periodWord}`}
              badge={reportData?.avg_social_media_time ? "Rata-rata" : "Siaga"}
              badgeType="warning"
              number="06"
              delay={400}
            />
            <MetricCard
              icon={Gamepad2}
              label="Rerata Game"
              value={
                reportData?.avg_game_time
                  ? `${Math.floor(reportData.avg_game_time / 60)}j ${Math.round(reportData.avg_game_time % 60)}m`
                  : "kosong"
              }
              sub={`Waktu main per ${periodWord}`}
              badge={reportData?.avg_game_time ? "Rata-rata" : "Siaga"}
              badgeType="warning"
              number="07"
              delay={480}
            />
            <div className="bg-paper p-5 sm:p-6 flex flex-col justify-between">
              <span className="eyebrow-sm text-ink/45 tabular-nums">08</span>
              <div className="flex flex-col">
                <span className="eyebrow-sm text-ink/65 mt-1">Catatan</span>
                <p className="text-xs text-ink/65 leading-relaxed mt-2">
                  Rerata dihitung dari rata-rata {periodWord} semua mahasiswa
                  pada rentang tanggal terpilih. Sumber: data log aplikasi.
                </p>
              </div>
            </div>
        </div>
      </section>

      {/* ─── Charts & Table ─── */}
      <section className="bg-paper border-t border-hairline">
        <div className="space-y-px bg-hairline">
          {/* Filters */}
          <div className="bg-paper">
            <GlassCard>
              <SectionHeader number="00" title="Filter Laporan" sub="Atur periode dan rentang tanggal" />
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1.5">
                    <Label className="eyebrow text-ink">Periode</Label>
                    <Tabs value={period} onValueChange={(v) => v && setPeriod(v as "daily" | "weekly" | "monthly")} className="w-auto">
                      <TabsList className="mb-3 border border-hairline">
                        <TabsTrigger value="daily" className="text-xs h-8 px-3">Harian</TabsTrigger>
                        <TabsTrigger value="weekly" className="text-xs h-8 px-3">Mingguan</TabsTrigger>
                        <TabsTrigger value="monthly" className="text-xs h-8 px-3">Bulanan</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="eyebrow text-ink">Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 w-auto"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="eyebrow text-ink">Tanggal Akhir</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 w-auto"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FilterChipBar
                      label="Klaster"
                      chips={[
                        { id: "all", label: "Semua" },
                        ...Object.entries(clusterLabels).map(([id, label]) => ({ id, label })),
                      ]}
                      active={clusterFilter !== "all" ? [clusterFilter] : []}
                      onToggle={(id) => setClusterFilter(id as typeof clusterFilter)}
                      onClear={() => setClusterFilter("all")}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 text-xs rounded-none"
                    onClick={() => void loadData()}
                    disabled={loading}
                  >
                    Terapkan
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Geofence Rekap — strip terpisah dengan 4 metric card
              (hadir %, inside, outside, unknown). Sama strip dashboard
              tetapi window-nya mengikuti periode laporan. */}
          <section className="border-t border-hairline">
            <div className="grid gap-px grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-full bg-hairline">
              <MetricCard
                icon={MapPin}
                label="Hadir di Kampus"
                value={geofence ? `${Math.round(geofence.inside_rate * 100)}%` : "kosong"}
                sub={geofence ? `Tingkat kehadiran · ${geofence.days} hari` : "Belum ada data geofence"}
                number="08"
                delay={0}
              />
              <MetricCard
                icon={Users}
                label="Di Lokasi"
                value={geofence ? geofence.inside.toLocaleString() : "kosong"}
                sub={`Sesi masuk kampus · ${geofence && geofence.inside > 0 ? "Terverifikasi" : "Menunggu"}`}
                number="09"
                delay={80}
              />
              <MetricCard
                icon={Users}
                label="Di Luar Lokasi"
                value={geofence ? geofence.outside.toLocaleString() : "kosong"}
                sub={`Sesi di luar kampus · ${geofence && geofence.outside > 0 ? "Perlu review" : "Kosong"}`}
                number="10"
                delay={160}
              />
              <MetricCard
                icon={ActivitySquare}
                label="Tanpa Data Lokasi"
                value={geofence ? geofence.unknown.toLocaleString() : "kosong"}
                sub={`Sesi tanpa fix GPS · ${geofence && geofence.unknown > 0 ? "Izin lokasi mati" : "Aman"}`}
                number="11"
                delay={240}
              />
            </div>
          </section>

          {/* Charts Row */}
          <section>
            <div className="grid gap-px lg:grid-cols-2 w-full max-w-full bg-hairline">
              {/* Cluster Trend Chart */}
              <div className="bg-paper">
                <GlassCard>
                  <SectionHeader
                    number="01"
                    title="Tren Klaster"
                    sub={`${CHART_LIMIT[period]} ${period === "daily" ? "hari" : period === "weekly" ? "minggu" : "bulan"} terakhir · distribusi per klaster`}
                    right={
                      <span className="eyebrow-sm text-ink/55 tabular-nums">
                        {period === "daily" ? "Harian" : period === "weekly" ? "Mingguan" : "Bulanan"}
                      </span>
                    }
                  />
                  <div className="px-5 pb-5">
                    {chartData.length > 0 ? (
                      <ReportsClusterBarChart labels={clusterNames} data={chartData} customTooltip={<CustomTooltip />} />
                    ) : (
                      <div className="h-[260px]">
                        <EmptyState
                          illustration="chart"
                          title="Belum ada data laporan"
                          description="Data laporan akan muncul setelah mahasiswa mulai menggunakan aplikasi mobile."
                        />
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Screen Time Chart */}
              <div className="bg-paper">
                <GlassCard>
                  <SectionHeader
                    number="02"
                    title="Waktu Layar"
                    sub={`Rata-rata menit per ${period === "daily" ? "hari" : period === "weekly" ? "minggu" : "bulan"}`}
                  />
                  <div className="px-5 pb-5">
                    {screenChartData.length > 0 ? (
                      <ReportsScreenAreaChart data={screenChartData} customTooltip={<CustomTooltip />} />
                    ) : (
                      <div className="h-[260px]">
                        <EmptyState
                          illustration="chart"
                          title="Belum ada data laporan"
                          description="Data laporan akan muncul setelah mahasiswa mulai menggunakan aplikasi mobile."
                        />
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          </section>

          {/* Detail Table */}
          <section className="bg-paper border-t border-hairline">
            <GlassCard>
              <SectionHeader
                number="03"
                title={`Detail Rekap ${period === "daily" ? "Harian" : period === "weekly" ? "Mingguan" : "Bulanan"}`}
                sub={`${DETAIL_LIMIT[period]} ${period === "daily" ? "hari" : period === "weekly" ? "minggu" : "bulan"} terakhir · ${tableData.length} entry · ${sortDescending ? "terbaru di atas" : "terlama di atas"}`}
                right={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs rounded-none border border-hairline bg-transparent hover:bg-ink/[0.03] hover:border-ink"
                    onClick={() => setSortDescending(v => !v)}
                    aria-label="Balik urutan laporan"
                  >
                    <ArrowDownUp className="h-3.5 w-3.5" />
                    {sortDescending ? "Terbaru di atas" : "Terlama di atas"}
                  </Button>
                }
              />
              <div className="px-5 pb-5 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-ink/[0.04]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink/65">
                        {period === "daily" ? "Tanggal" : period === "weekly" ? "Minggu" : "Bulan"}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-ink/65">Total Mahasiswa</th>
                      {clusterNames.map(name => <th key={name} className="text-right px-4 py-3 text-xs font-medium text-ink/65">{name}</th>)}
                      <th className="text-right px-4 py-3 text-xs font-medium text-ink/65">Rerata Skor</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-ink/65">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={clusterNames.length + 4} className="p-0">
                          <EmptyState
                            illustration="chart"
                            title="Belum ada data laporan"
                            description="Data laporan akan muncul setelah mahasiswa mulai menggunakan aplikasi mobile."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    {loading && tableData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={clusterNames.length + 4} className="px-4 py-8 text-center text-sm text-ink/55">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    )}
                    {tableData.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-ink/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-ink">{row.label}</td>
                        <td className="px-4 py-3 text-right text-ink">{row.total}</td>
                        {clusterNames.map(name => <td key={name} className="px-4 py-3 text-right font-mono">{row.clusters[name] ?? 0}</td>)}
                        <td className="px-4 py-3 text-right font-mono text-ink">{row.avgScore}</td>
                        <td className="px-4 py-3 text-right">
                          <DownloadButton
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            showChevron={false}
                            filename={`laporan-${row.label.toLowerCase().replace(/\s/g, "-")}`}
                            data={[{
                              periode: row.label,
                              total: row.total,
                ...Object.fromEntries(clusterNames.map(name => [`cluster:${name}`, row.clusters[name] ?? 0])),
                              avg_screen_time: row.avgScreen !== "kosong" ? row.avgScreen : undefined,
                              skor_distraksi: row.avgScore,
                            }]}
                            columns={[
                              { key: "periode", label: "Periode" },
                              { key: "total", label: "Total Mahasiswa" },
                              ...clusterColumns,
                              { key: "avg_screen_time", label: "Rerata Screen Time (m)" },
                              { key: "skor_distraksi", label: "Skor Distraksi" },
                            ]}
                            title={`Laporan · ${row.label}`}
                            label="Unduh"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </section>
        </div>
      </section>
    </div>
  );
}
