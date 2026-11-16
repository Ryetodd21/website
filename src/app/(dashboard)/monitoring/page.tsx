"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  RefreshCw,
  Search,
  Smartphone,
  ActivitySquare,
  Users,
  Clock,
  ArrowUp,
  KeyRound,
  MessageCircle,
  Gamepad2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterChipBar } from "@/components/ui/filter-chip-bar";
import { SortableHeader, useSort } from "@/components/ui/sortable-header";
import { AnimatedMetricValue } from "@/components/ui/animated-metric-value";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard, SectionHeader, MetricCard, PageHeader } from "@/components/metrics";
import { DownloadButton } from "@/components/ui/download-button";
import { EmptyState } from "@/components/ui/empty-state";
import { subscribeLogsStreamWebSocket, LogStreamEvent, apiFetch, getDashboardSummary, type DashboardSummary, type StudentListResponse } from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";
import { MONITORING_STUDENT_LIMIT, NEW_LOG_HIGHLIGHT_MS } from "@/lib/limits";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────

interface MonitoringStudent {
  id: string;
  student: string;
  nim: string;
  kelas: string;
  mk: string;
  dosen: string;
  cluster: string;
  score: number | null;
  hadir: number;
  tidakHadir: number;
  avgScreenTime: string;
  // Round 11: trio of averages surfaced from each app_log SSE event so the
  // monitoring strip can show them alongside the existing Rerata Screen Time
  // card. Strings (not numbers) so we can render "kosong" when no event
  // has arrived yet.
  avgUnlockCount: string;
  avgSocialMediaTime: string;
  avgGameTime: string;
  lastActive: string;
  logCount: number;
  isConnected: boolean;  // true = dari mobile app, false = seed
}

interface SyncStats {
  totalLogs: number;
  activeStudents: number;
  appLogs: number;
  locationLogs: number;
  lastUpdate: string;
}

// ─── Component ────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

function formatTimeNow(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  }) + " WITA";
}

function clusterBadgeClass(cluster: string): string {
  // Editorial: colored dot + uppercase text, no pill background.
  // Dot color follows Okabe-Ito: Rendah=teal, Sedang=amber, Tinggi=fuchsia.
  return cluster.includes("Rendah")
    ? "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-success"
    : cluster.includes("Sedang")
    ? "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-warning"
    : "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink";
}

function clusterDotClass(cluster: string): string {
  return cluster.includes("Rendah")
    ? "h-1.5 w-1.5 rounded-full bg-success shrink-0"
    : cluster.includes("Sedang")
    ? "h-1.5 w-1.5 rounded-full bg-warning shrink-0"
    : "h-1.5 w-1.5 rounded-full bg-primary shrink-0";
}

export default function MonitoringPage() {
  const [students, setStudents] = useState<MonitoringStudent[]>([]);
  const [search, setSearch] = useState("");
  const [dosenFilter, setDosenFilter] = useState("all");
  const [mkFilter, setMkFilter] = useState("all");
  const [clusterFilter, setClusterFilter] = useState("all");
  const [uniqueDosen, setUniqueDosen] = useState<string[]>([]);
  const [uniqueMk, setUniqueMk] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  // Cohort-level averages from /api/reports/summary. Fall back to local
  // computation only if summary is empty (offline / first load).
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<SyncStats>({
    totalLogs: 0,
    activeStudents: 0,
    appLogs: 0,
    locationLogs: 0,
    lastUpdate: "kosong",
  });
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  // Total mahasiswa terdaftar (unfiltered, from server). Used by the metric
  // strip so filter state doesn't shrink the "Mahasiswa Terdaftar" number.
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const studentMap = useRef<Record<string, MonitoringStudent>>({});
  const initialized = useRef(false);

  const { key: sortKey, dir: sortDir, toggle: toggleSort, sorted: sortedStudents } = useSort<MonitoringStudent>("lastActive", "desc");

  // Load real students from API on mount
  useEffect(() => {
    const ctrl = new AbortController();
    async function loadStudents() {
      try {
        // Round 30 audit (P2): use the typed StudentListResponse from
        // api.ts instead of `{ items: any[] }`. The `items: any[]` form
        // silently swallowed all field shape errors at the type level —
        // a refactor of `Student` would not break this file.
        const data = await apiFetch<StudentListResponse>(
          `/api/students?page_size=${MONITORING_STUDENT_LIMIT}`,
          { signal: ctrl.signal }
        );

        const loaded: MonitoringStudent[] = (data.items || []).map((s) => {
          const score = s.distraction_score ?? null;
          return {
            id: s.id,
            student: s.full_name || s.id.slice(0, 8),
            nim: s.nim || "kosong",
            kelas: s.study_program || "kosong",
            mk: s.study_program || "kosong",
            dosen: s.advisor_name || "kosong",
            cluster: s.cluster_name || "Tanpa data",
            score,
            hadir: 0,
            tidakHadir: 0,
            // Per-student averages come from the cohort summary (today's
            // /api/reports/summary); the per-student "kosong" default is
            // only kept for the rare case where summary returns nothing.
            avgScreenTime: "kosong",
            avgUnlockCount: "kosong",
            avgSocialMediaTime: "kosong",
            avgGameTime: "kosong",
            lastActive: "kosong",
            logCount: 0,
            isConnected: false,  // seed data — belum sinkronisasi dari mobile
          };
        });

        setStudents(loaded);
        // Round 30 audit (P2): use the server's `total` field (count of
        // ALL students matching the filter) instead of the loaded page
        // length. The previous code showed "17 registered" when there
        // were 100 actually registered, because page 1 only returned 17
        // items.
        setTotalRegistered(data.total ?? loaded.length);
        // Derive filter options from student data — no hardcoding needed
        const dosenSet = new Set<string>();
        const mkSet = new Set<string>();
        for (const s of loaded) {
          if (s.dosen && s.dosen !== "kosong") dosenSet.add(s.dosen);
          if (s.mk && s.mk !== "kosong") mkSet.add(s.mk);
        }
        setUniqueDosen([...dosenSet].sort());
        setUniqueMk([...mkSet].sort());
        initialized.current = true;
        setInitialLoading(false);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        toast.error("Gagal memuat data mahasiswa monitoring");
        setInitialLoading(false);
      }
    }
    loadStudents();

    // Cohort-level averages from summary endpoint. These power the trio of
    // Rerata cards at the top of the page; pulling from the backend avoids
    // the "kosong" strings that came from the per-student seed defaults.
    getDashboardSummary(ctrl.signal)
      .then((s) => setSummary(s))
      .catch((e) => {
        if (e instanceof Error && e.name === "AbortError") return;
        // Silent: fall back to local computation if summary is unreachable.
      });

    const handleFilterChanged = () => {
      loadStudents();
      getDashboardSummary(ctrl.signal).then(setSummary).catch(() => {});
    };
    window.addEventListener("academic-filter-changed", handleFilterChanged);

    return () => {
      ctrl.abort();
      window.removeEventListener("academic-filter-changed", handleFilterChanged);
    };
  }, []);

  useEffect(() => {
    const map: Record<string, MonitoringStudent> = {};
    for (const s of students) map[s.id] = s;
    studentMap.current = map;
  }, [students]);

  // Round 20: dedupe SSE events by (student_id, log_date) for the cohort
  // counters. With UPSERT, the same (student, date) fires a new event on
  // every sync — without dedupe, prev.appLogs would inflate N× per day.
  // We keep the most recent event per (student, date) so each unique day
  // contributes exactly one app_log count. A separate Set tracks the
  // location_log timestamps since they ARE per-fix events.
  const lastSeenAppLogKey = useRef<Set<string>>(new Set());
  const lastSeenLocationKey = useRef<Set<string>>(new Set());
  // Round 26 audit (P1): track per-event highlight timers so they can be
  // cleared if the user navigates away from /monitoring before
  // NEW_LOG_HIGHLIGHT_MS expires. Without this, every new log event
  // schedules a setTimeout that fires setNewLogIds on an unmounted
  // component (React 18 warning) and increments a no-longer-shown
  // highlight chip count.
  const newLogTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const appLogKeys = lastSeenAppLogKey.current;
    const locationKeys = lastSeenLocationKey.current;
    const highlightTimers = newLogTimersRef.current;
    // WebSocket connection — same format as SSE but lower overhead + native browser
    // support (no EventSource polyfill). Reconnects with exponential backoff.
    const cleanup = subscribeLogsStreamWebSocket((event: LogStreamEvent) => {
      if (event.event === "connected" || event.event === "disconnected") {
        setConnected(event.event === "connected");
        return;
      }

      const timeStr = formatTimeNow();
      const studentId = event.student_id || "";

      if (event.type === "app_log" || event.type === "location_log") {
        // Round 20: dedupe by (student_id, log_date) for app_log events
        // because the same day now fires one event per UPSERT sync, not
        // one per row. The cohort-level "appLogs" counter should reflect
        // unique days, not event volume. location_log events are per-fix
        // so we dedupe those by (student_id, recorded_at) instead.
        const isAppLog = event.type === "app_log";
        const dedupKey = isAppLog
          ? `${studentId}|${event.log_date || ""}`
          : `${studentId}|${event.recorded_at || ""}`;
        const seenSet = isAppLog ? appLogKeys : locationKeys;
        const isNewEvent = !seenSet.has(dedupKey);
        if (isNewEvent) {
          seenSet.add(dedupKey);
          // Bound the Set so it doesn't grow forever in a long-running session.
          // Keep the last 500 keys; older ones fall out and re-count if the
          // event happens to repeat (acceptable approximation).
          if (seenSet.size > 500) {
            const arr = Array.from(seenSet);
            seenSet.clear();
            for (const k of arr.slice(-250)) seenSet.add(k);
          }
        }

        const existing = studentMap.current[studentId];
        const updated: MonitoringStudent = existing
          ? { ...existing }
          : {
              id: studentId,
              student: studentId.slice(0, 8) || "?",
              nim: studentId.slice(-8) || "kosong",
              kelas: "kosong",
              mk: "kosong",
              dosen: "kosong",
              cluster: "Tanpa data",
              score: null,
              hadir: 0,
              tidakHadir: 0,
              avgScreenTime: "kosong",
              avgUnlockCount: "kosong",
              avgSocialMediaTime: "kosong",
              avgGameTime: "kosong",
              lastActive: timeStr,
              logCount: 0,
              isConnected: true,  // from mobile app, real sync
            };

        if (event.type === "app_log") {
          const mins = event.total_screen_time_minutes || 0;
          updated.avgScreenTime = formatDuration(mins);
          // Round 11: the three new averages are populated from each SSE event
          // as a one-shot display of the most recent daily rollup. Average
          // across the connected cohort is computed lower down.
          updated.avgUnlockCount = String(event.unlock_count ?? 0);
          updated.avgSocialMediaTime = formatDuration(event.social_media_time_minutes ?? 0);
          updated.avgGameTime = formatDuration(event.game_time_minutes ?? 0);
          updated.score = event.distraction_score ?? updated.score;
          updated.cluster = event.cluster_name || updated.cluster;
          // Per-student logCount: increment only on first event for this
          // (student, log_date). Subsequent UPSERTs of the same day don't
          // // change the count.
          if (isNewEvent) {
            updated.logCount = (updated.logCount || 0) + 1;
          }
        }

        updated.lastActive = timeStr;
        updated.isConnected = true;  // Mark as connected via mobile app

        setStudents((prev) => {
          const idx = prev.findIndex((s) => s.id === studentId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev];
        });

        setNewLogIds((prev) => new Set([...prev, studentId]));
        const timer = setTimeout(() => {
          setNewLogIds((prev) => {
            const next = new Set(prev);
            next.delete(studentId);
            return next;
          });
          highlightTimers.delete(timer);
        }, NEW_LOG_HIGHLIGHT_MS);
        highlightTimers.add(timer);

        if (isNewEvent) {
          setStats((prev) => ({
            totalLogs: prev.totalLogs + 1,
            activeStudents: event.type === "app_log" ? prev.activeStudents + 1 : prev.activeStudents,
            appLogs: event.type === "app_log" ? prev.appLogs + 1 : prev.appLogs,
            locationLogs: event.type === "location_log" ? prev.locationLogs + 1 : prev.locationLogs,
            lastUpdate: timeStr,
          }));
        } else {
          setStats((prev) => ({ ...prev, lastUpdate: timeStr }));
        }
      }
    });

    return () => {
      cleanup();
      appLogKeys.clear();
      locationKeys.clear();
      // Round 26 audit (P1): cancel any pending highlight timers so they
      // don't fire setState on an unmounted component.
      highlightTimers.forEach((t) => clearTimeout(t));
      highlightTimers.clear();
    };
  }, [studentMap]);

  // Round 30 audit (P2): memoize filter+sort together. Without this,
  // the SSE stream's per-event setStudents caused a full students.filter
  // + sortedStudents (re-sort copy) on every render — 100 events/sec
  // meant 100 re-sorts/sec even when the new event didn't change any
  // row's rank. Now the memo only recomputes when students, search, or
  // any filter changes.
  const filteredSorted = useMemo(() => {
    const f = students.filter((item) => {
      const matchSearch =
        !search ||
        item.student.toLowerCase().includes(search.toLowerCase()) ||
        item.nim.includes(search) ||
        item.mk.toLowerCase().includes(search.toLowerCase());
      const matchDosen = dosenFilter === "all" || item.dosen.includes(dosenFilter);
      const matchMk = mkFilter === "all" || item.mk === mkFilter;
      const matchCluster = clusterFilter === "all" || item.cluster === clusterFilter;
      return matchSearch && matchDosen && matchMk && matchCluster;
    });
    return sortedStudents(f);
  }, [students, search, dosenFilter, mkFilter, clusterFilter, sortedStudents]);

  const clusterNames = [...new Set(students.map(student => student.cluster))].sort();
  const clusterCounts = clusterNames.map(label => ({
    label, value: students.filter(student => student.cluster === label).length, dot: "bg-primary",
  }));

  const connectedStudents = students.filter(s => s.isConnected);
  // Round 11: the connected cohort drives three new cohort-level averages.
  // We parse the per-student strings back into numbers (same trick as the
  // existing screen-time reducer) and divide by the cohort size.
  const cohortSize = connectedStudents.length;
  // Round 30 audit (P2): return null for the "kosong" sentinel and any
  // other unparseable string. The previous code returned 0 for them,
  // which silently pulled the rolling cohort average down to near-zero.
  // The avgMins helper filters nulls out of the sum and the denominator
  // so the average only counts students with actual measurements.
  function parseMins(s: string | undefined): number | null {
    if (!s || s === "kosong") return null
    const parts = s.match(/(\d+)j\s*(\d+)m/);
    if (parts) return parseInt(parts[1]) * 60 + parseInt(parts[2]);
    const m = s.match(/(\d+)m/);
    return m ? parseInt(m[1]) : null;
  }
  function avgMins(getter: (s: MonitoringStudent) => string | undefined): number {
    const values = connectedStudents
      .map((s) => parseMins(getter(s)))
      .filter((v): v is number => v !== null)
    if (values.length === 0) return 0
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
  }
  const avgScreenMin = avgMins((s) => s.avgScreenTime)
  const avgH = Math.floor(avgScreenMin / 60);
  const avgM = avgScreenMin % 60;

  // Round 30 audit (P2): filter parseInt failures out of the average
  // (was: `|| 0` which silently skewed low).
  const avgUnlock = (() => {
    const values = connectedStudents
      .map((s) => parseInt(s.avgUnlockCount))
      .filter((v): v is number => !isNaN(v))
    if (values.length === 0) return 0
    return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10
  })()

  const avgSosmedMin = avgMins((s) => s.avgSocialMediaTime)
  const sosmedH = Math.floor(avgSosmedMin / 60);
  const sosmedM = avgSosmedMin % 60;

  const avgGameMin = avgMins((s) => s.avgGameTime)
  const gameH = Math.floor(avgGameMin / 60);
  const gameM = avgGameMin % 60;

  return (
    <div className="space-y-0">
      {/* ─── Welcome Header ─── */}
      <PageHeader
        title="Monitoring Mahasiswa"
        subtitle="Monitor berdasarkan dosen & mata kuliah"
        connected={connected}
        statusBadge={{ type: connected ? "active" : "warning", label: connected ? "Sistem Aktif" : "Menunggu" }}
        rightActions={
          <>
            <DownloadButton
              filename="monitoring-mahasiswa"
              data={students.map((s) => ({
                nim: s.nim,
                nama: s.student,
                kelas: s.kelas,
                mata_kuliah: s.mk,
                dosen: s.dosen,
                klaster: s.cluster,
                skor: s.score == null ? null : Number(s.score.toFixed(4)),
                hadir: s.hadir,
                tidak_hadir: s.tidakHadir,
                avg_screen_time: s.avgScreenTime,
                avg_unlock_count: s.avgUnlockCount,
                avg_social_media_time: s.avgSocialMediaTime,
                avg_game_time: s.avgGameTime,
                last_active: s.lastActive,
                log_count: s.logCount,
              }))}
              columns={[
                { key: "nim", label: "NIM" },
                { key: "nama", label: "Nama" },
                { key: "kelas", label: "Kelas" },
                { key: "mata_kuliah", label: "Mata Kuliah" },
                { key: "dosen", label: "Dosen" },
                { key: "klaster", label: "Klaster" },
                { key: "skor", label: "Skor" },
                { key: "hadir", label: "Hadir" },
                { key: "tidak_hadir", label: "Tidak Hadir" },
                { key: "avg_screen_time", label: "Rerata Screen Time" },
                { key: "avg_unlock_count", label: "Rerata Unlock" },
                { key: "avg_social_media_time", label: "Rerata Sosmed" },
                { key: "avg_game_time", label: "Rerata Game" },
                { key: "last_active", label: "Aktif Terakhir" },
                { key: "log_count", label: "Jumlah Log" },
              ]}
              title="Monitoring Mahasiswa"
              label="Export"
            />
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-none border-hairline bg-transparent hover:border-ink hover:bg-transparent" onClick={() => setStudents([])}>
              <RefreshCw className="h-3.5 w-3.5" />
              Atur Ulang
            </Button>
          </>
        }
      />

      {/* ─── Metric Strip ─── */}
      <section className="border-t border-hairline">
        <div className="grid gap-px grid-cols-2 lg:grid-cols-4 w-full max-w-full bg-hairline">
            <MetricCard
              icon={Users}
              label="Mahasiswa Terdaftar"
              value={<AnimatedMetricValue value={totalRegistered} />}
              sub="Total di database"
              badge="Terdaftar"
              number="01"
              delay={0}
            />
            <MetricCard
              icon={Users}
              label="Mahasiswa Terhubung"
              value={<AnimatedMetricValue value={stats.activeStudents} />}
              sub="Dari mobile app"
              badge={stats.activeStudents > 0 ? "Terhubung" : "Belum ada"}
              number="02"
              delay={80}
            />
            <MetricCard
              icon={ActivitySquare}
              label="Log Sync Mobile"
              value={<AnimatedMetricValue value={stats.totalLogs} />}
              sub={connected ? "Stream aktif" : "Menunggu koneksi"}
              badge={connected ? "Aktif" : "Pending"}
              number="03"
              delay={160}
            />
            <MetricCard
              icon={Smartphone}
              label="Penggunaan App"
              value={<AnimatedMetricValue value={stats.appLogs} />}
              sub="Log aplikasi"
              badge={stats.appLogs > 0 ? "Update" : "Siaga"}
              number="04"
              delay={160}
            />
            <MetricCard
              icon={Clock}
              label="Rerata Screen Time"
              value={summary?.avg_screen_time_today_min != null
                ? `${Math.floor(summary.avg_screen_time_today_min / 60)}j ${Math.round(summary.avg_screen_time_today_min % 60)}m`
                : (students.length > 0 ? `${avgH}j ${avgM}m` : "kosong")}
              sub={summary ? "Rerata hari ini" : "Rerata dari mobile yang terhubung"}
              badge={summary ? "Database" : "Live"}
              number="05"
              delay={240}
            />
            <MetricCard
              icon={KeyRound}
              label="Rerata Unlock Count"
              value={summary?.avg_unlock_count_today != null
                ? Number(summary.avg_unlock_count_today).toLocaleString("id-ID")
                : (cohortSize > 0 ? avgUnlock.toLocaleString("id-ID") : "kosong")}
              sub={summary ? "Rerata hari ini" : "Per mahasiswa per hari"}
              badge={summary ? "Database" : "Live"}
              number="06"
              delay={320}
            />
            <MetricCard
              icon={MessageCircle}
              label="Rerata Sosmed"
              value={summary?.avg_social_media_time_today_min != null
                ? `${Math.floor(summary.avg_social_media_time_today_min / 60)}j ${Math.round(summary.avg_social_media_time_today_min % 60)}m`
                : (cohortSize > 0 ? `${sosmedH}j ${sosmedM}m` : "kosong")}
              sub={summary ? "Rerata hari ini" : "Waktu buka per hari"}
              badge={summary ? "Database" : "Live"}
              number="07"
              delay={400}
            />
            <MetricCard
              icon={Gamepad2}
              label="Rerata Game"
              value={summary?.avg_game_time_today_min != null
                ? `${Math.floor(summary.avg_game_time_today_min / 60)}j ${Math.round(summary.avg_game_time_today_min % 60)}m`
                : (cohortSize > 0 ? `${gameH}j ${gameM}m` : "kosong")}
              sub={summary ? "Rerata hari ini" : "Waktu main per hari"}
              badge={summary ? "Database" : "Live"}
              number="08"
              delay={480}
            />
        </div>
      </section>

      {/* ─── Cluster Summary + Filters ─── */}
      <section className="border-t border-hairline">
        <div className="space-y-px bg-hairline">
          <div className="bg-paper">
            <GlassCard>
              <SectionHeader
                title="Ringkasan Klaster"
                sub={`Total ${students.length} mahasiswa termonitor`}
                right={
                  <Badge variant="outline" className="text-xs gap-1 border-border/50">
                    <ArrowUp className="h-3 w-3 text-success" />
                    Urutkan aktif terakhir
                  </Badge>
                }
              />
              <div className="px-6 pb-6">
                {/* Cluster counts bar */}
                <div className="grid grid-cols-3 gap-0">
                  {clusterCounts.map((c, i) => (
                    <div key={c.label} className={`px-4 py-4 ${i > 0 ? "border-l border-hairline" : ""}`}>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`h-1.5 w-1.5 ${c.dot}`} />
                        <span className="eyebrow-sm text-ink/55">{c.label}</span>
                      </div>
                      <p className="display-sans text-2xl sm:text-3xl text-ink leading-none tabular-nums">
                        {c.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
                    <Input
                      placeholder="Cari nama, NIM, atau MK..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-7 h-9 border-0 border-b border-hairline rounded-none bg-transparent text-sm focus:border-ink focus-visible:ring-0"
                    />
                  </div>
                  <Select value={dosenFilter} onValueChange={(v) => v && setDosenFilter(v)}>
                    <SelectTrigger className="w-[220px] h-9 rounded-none border-hairline"><SelectValue placeholder="Filter Dosen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Dosen</SelectItem>
                      {uniqueDosen.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={mkFilter} onValueChange={(v) => v && setMkFilter(v)}>
                    <SelectTrigger className="w-[200px] h-9 rounded-none border-hairline"><SelectValue placeholder="Filter MK" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua MK</SelectItem>
                      {uniqueMk.map((mk) => (
                        <SelectItem key={mk} value={mk}>{mk}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FilterChipBar
                    label="Klaster"
                    chips={[
                      { id: "all", label: "Semua" },
                      ...clusterNames.map(label => ({ id: label, label })),
                    ]}
                    active={clusterFilter !== "all" ? [clusterFilter] : []}
                    onToggle={(id) => setClusterFilter(id)}
                    onClear={() => setClusterFilter("all")}
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* ─── Student Table ─── */}
          <div className="bg-paper">
            <GlassCard>
              <SectionHeader
                title="Daftar Mahasiswa"
                sub={`${filteredSorted.length} terdaftar · ${connectedStudents.length} terhubung mobile · ${students.length - connectedStudents.length} pending`}
                right={
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setStudents((prev) => [...prev])}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                }
              />
              <div className="px-5 pb-5">
                {initialLoading ? (
                  <SkeletonTable rows={6} cols={8} />
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortableHeader label="Mahasiswa" sortKey="student" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      </TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead>
                        <SortableHeader label="Klaster" sortKey="cluster" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortableHeader label="Skor" sortKey="score" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortableHeader label="Rerata Screen" sortKey="avgScreenTime" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortableHeader label="Log Count" sortKey="logCount" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                      </TableHead>
                      <TableHead>
                        <SortableHeader label="Terakhir Aktif" sortKey="lastActive" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <EmptyState
                            illustration="monitor"
                            title={connected ? "Menunggu data real-time..." : "Belum ada data yang cocok"}
                            description={connected
                              ? "Stream MQTT tersambung. Akan terisi otomatis saat aplikasi mobile publish event."
                              : "Coba ubah filter pencarian, atau pastikan broker & subscriber berjalan."}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSorted.map((item) => (
                        <TableRow
                          key={item.id}
                          className={`cursor-pointer transition-colors duration-300 ${
                            newLogIds.has(item.id) ? "bg-ink/[0.02]" : ""
                          }`}
                        >
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{item.student}</p>
                              <p className="text-xs text-ink/55">{item.nim}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{item.kelas}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{item.mk}</TableCell>
                          <TableCell className="text-sm text-ink/55">{item.dosen}</TableCell>
                          <TableCell>
                            <span className={clusterBadgeClass(item.cluster)}>
                              <span className={clusterDotClass(item.cluster)} />
                              {item.cluster}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{item.score?.toFixed(2) ?? "Belum dinilai"}</TableCell>
                          <TableCell className="text-right text-sm text-ink/55">{item.avgScreenTime}</TableCell>
                          <TableCell className="text-right text-sm">
                            <Badge variant="outline" className="text-xs font-mono">{item.logCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-ink/55">
                              <Clock className="h-3 w-3" />
                              {item.isConnected && item.lastActive !== "kosong"
                                ? item.lastActive
                                : "Pending"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
