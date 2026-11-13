"use client";
import { useEffect, useRef, useState } from "react";
import {
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard, SectionHeader, MetricCard, PageHeader } from "@/components/metrics";
import { DownloadButton } from "@/components/ui/download-button";
import { FilterChipBar } from "@/components/ui/filter-chip-bar";
import { SortableHeader, useSort } from "@/components/ui/sortable-header";
import { subscribeLogsStreamWebSocket, LogStreamEvent, apiFetch, RedirectError, getLogHistory } from "@/lib/api";
import { toast } from "sonner";
import type { Student } from "@/lib/api";
import { LOG_STUDENT_LIMIT, LOG_HISTORY_FETCH_SIZE, LOGS_BUFFER_SIZE } from "@/lib/limits";

interface LiveLog {
  id: string;
  student_id: string;
  student_name: string;
  nim: string;
  date: string;
  time: string;
  type: "App Usage" | "Lokasi" | "App Usage + Lokasi";
  screenTime: string;
  sosmed: string;
  game: string;
  unlock: number;
  lokasi: string;
  status: "processed" | "pending";
}

interface SyncStats {
  total: number;
  processed: number;
  pending: number;
  failed: number;
  lastSync: string;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar",
  }) + " WITA";
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LiveLog[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  // Round 26 — column sorting for the live log table.
  const { key: sortKey, dir: sortDir, toggle: toggleSort, sorted: sortRows } = useSort<LiveLog>("date", "desc");
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<SyncStats>({
    total: 0, processed: 0, pending: 0, failed: 0, lastSync: "kosong",
  });
  // Read updated student names without restarting the WebSocket subscription.
  const studentMapRef = useRef<Record<string, Student>>({});
  // Round 20: dedupe SSE events by (student_id, log_date) for the live
  // table. UPSERT path means the same day fires one event per sync; we
  // keep the last-seen key set so stats counts match unique day count.
  const seenLiveLogKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ctrl = new AbortController();
    async function loadStudents() {
      try {
        const data = await apiFetch<{ items: Student[] }>(
          `/api/students?page_size=${LOG_STUDENT_LIMIT}`,
          { signal: ctrl.signal }
        );
        const map: Record<string, Student> = {};
        for (const s of data.items ?? []) {
          map[s.id] = { id: s.id, nim: s.nim, full_name: s.full_name, study_program: s.study_program, semester: s.semester };
        }
        studentMapRef.current = map;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        // apiFetch navigates to /login before throwing
        // RedirectError — suppress the toast since the page is about to
        // navigate. The bare "Gagal memuat data mahasiswa" toast was the
        // user-visible symptom of this race before the fix.
        if (e instanceof RedirectError) return;
        toast.error("Gagal memuat data mahasiswa");
      }
    }
    loadStudents();
    return () => ctrl.abort();
  }, []);

  // Fetch historical logs from DB on mount (student_name/nim included in response)
  useEffect(() => {
    const ctrl = new AbortController();
    async function loadHistory() {
      try {
        const events = await getLogHistory(LOG_HISTORY_FETCH_SIZE, ctrl.signal);
        const historical: LiveLog[] = events.map((ev) => {
          const studentName = ev.student_name || ev.student_id?.slice(0, 8) || "?";
          const nim = ev.nim || "kosong";
          if (ev.type === "app_log") {
            return {
              id: `hist-${ev.log_date}-${ev.student_id}`,
              student_id: ev.student_id || "",
              student_name: studentName,
              nim,
              date: ev.log_date ? formatDate(ev.log_date) : "",
              time: "", // log_date is date-only (YYYY-MM-DD), no time component
              type: "App Usage" as const,
              screenTime: formatDuration(ev.total_screen_time_minutes || 0),
              sosmed: formatDuration(ev.social_media_time_minutes || 0),
              game: formatDuration(ev.game_time_minutes || 0),
              unlock: ev.unlock_count || 0,
              lokasi: "kosong",
              status: "processed" as const,
            };
          } else {
            return {
              id: `hist-${ev.recorded_at}-${ev.student_id}`,
              student_id: ev.student_id || "",
              student_name: studentName,
              nim,
              date: ev.recorded_at ? formatDate(ev.recorded_at) : "",
              time: ev.recorded_at ? formatTime(ev.recorded_at) : "",
              type: "Lokasi" as const,
              screenTime: "",
              sosmed: "",
              game: "",
              unlock: 0,
              lokasi: ev.is_on_campus ? "Di kampus" : "Di luar kampus",
              status: "processed" as const,
            };
          }
        });
        if (historical.length > 0) {
          // ponytail: extract lastEventTimestamp from raw events before mapping
          const lastRaw = events[0];
          const lastTs = lastRaw.type === "app_log"
            ? lastRaw.log_date
            : lastRaw.recorded_at;
          setLogs((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const newOnes = historical.filter((l) => !existingIds.has(l.id));
            return [...prev, ...newOnes].sort((a, b) => {
              const ta = a.time ? new Date(a.time).getTime() : 0;
              const tb = b.time ? new Date(b.time).getTime() : 0;
              return tb - ta;
            }).slice(0, LOGS_BUFFER_SIZE);
          });
          // ponytail: historical DB events are all processed (none pending)
          setStats({
            total: historical.length,
            processed: historical.length,
            pending: 0,
            failed: 0,
            lastSync: lastTs ? formatTime(lastTs) : "kosong",
          });

        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        // Silent failure — SSE will populate data as events arrive
      }
    }
    loadHistory();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const seenKeys = seenLiveLogKeys.current;
    const unsub = subscribeLogsStreamWebSocket((event: LogStreamEvent) => {
      if (event.event === "connected" || event.event === "disconnected") {
        setConnected(event.event === "connected");
        return;
      }

      const student = studentMapRef.current[event.student_id || ""];
      const studentName = student?.full_name || event.student_id?.slice(0, 8) || "?";
      const nim = student?.nim || "kosong";

      if (event.type === "app_log") {
        const logDate = event.log_date || new Date().toISOString();
        // Round 20: dedupe by (student_id, log_date). The same day can fire
        // a new event on every UPSERT sync, but the logs page should show
        // exactly one row per (student, day) — use a stable id so React's
        // keyed reconciliation collapses the update into the existing row.
        const dedupKey = `${event.student_id || ""}|${event.log_date || ""}`;
        const isNewEvent = !seenKeys.has(dedupKey);
        if (isNewEvent) {
          seenKeys.add(dedupKey);
          if (seenKeys.size > 500) {
            const arr = Array.from(seenKeys);
            seenKeys.clear();
            for (const k of arr.slice(-250)) seenKeys.add(k);
          }
        }
        const newLog: LiveLog = {
          id: `live-${dedupKey}`,
          student_id: event.student_id || "",
          student_name: studentName,
          nim,
          date: formatDate(logDate),
          time: "", // log_date is date-only, no time component
          type: "App Usage",
          screenTime: formatDuration(event.total_screen_time_minutes || 0),
          sosmed: formatDuration(event.social_media_time_minutes || 0),
          game: formatDuration(event.game_time_minutes || 0),
          unlock: event.unlock_count || 0,
          lokasi: "kosong",
          status: "processed",
        };
        setLogs((prev) => {
          // Replace existing row for this (student, date) in-place; the
          // updated values are the latest day totals from the server.
          const without = prev.filter((l) => l.id !== newLog.id);
          return [newLog, ...without].slice(0, LOGS_BUFFER_SIZE);
        });
        if (isNewEvent) {
          setStats((prev) => ({
            ...prev,
            total: prev.total + 1,
            processed: prev.processed + 1,
          }));
        }
      }

      if (event.type === "location_log") {
        // FIX: use event.recorded_at instead of new Date()
        const recDate = event.recorded_at || new Date().toISOString();
        const lokasi = event.is_on_campus ? "Di kampus" : "Di luar kampus";
        const newLog: LiveLog = {
          id: `live-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          student_id: event.student_id || "",
          student_name: studentName,
          nim,
          date: formatDate(recDate),
          time: formatTime(recDate),
          type: "Lokasi",
          screenTime: "",
          sosmed: "",
          game: "",
          unlock: 0,
          lokasi,
          status: "processed",
        };
        setLogs((prev) => [newLog, ...prev.slice(0, LOGS_BUFFER_SIZE)]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          processed: prev.processed + 1,
          lastSync: formatTime(recDate),
        }));
      }
    });

    return () => {
      unsub();
      seenKeys.clear();
    };
  }, []);

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.student_name.toLowerCase().includes(search.toLowerCase()) ||
      log.nim.includes(search);
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    const matchType = typeFilter === "all" || log.type.includes(typeFilter);
    return matchSearch && matchStatus && matchType;
  });

  const syncProgress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;

  return (
    <div className="space-y-5 py-4">
      {/* ─── Welcome Header ─── */}
      <PageHeader
        title="Ringkasan Harian Mahasiswa"
        subtitle="Satu baris per mahasiswa per hari, sync ulang dari Android menggantikan data, bukan menambah"
        connected={connected}
        statusBadge={{
          type: connected ? "active" : "warning",
          label: connected ? "Sistem Aktif" : "Menunggu Broker",
        }}
        rightActions={
          <>
            <DownloadButton
              filename="ringkasan-harian"
              data={logs.map((l) => ({
                tanggal: l.date,
                waktu: l.time,
                nim: l.nim,
                nama: l.student_name,
                tipe: l.type,
                screen_time: l.screenTime,
                sosmed: l.sosmed,
                game: l.game,
                unlock: l.unlock,
                lokasi: l.lokasi,
                status: l.status,
              }))}
              columns={[
                { key: "tanggal", label: "Tanggal" },
                { key: "waktu", label: "Waktu" },
                { key: "nim", label: "NIM" },
                { key: "nama", label: "Nama" },
                { key: "tipe", label: "Tipe" },
                { key: "screen_time", label: "Waktu Layar" },
                { key: "sosmed", label: "Sosmed" },
                { key: "game", label: "Game" },
                { key: "unlock", label: "Unlock" },
                { key: "lokasi", label: "Lokasi" },
                { key: "status", label: "Status" },
              ]}
              title="Ringkasan Harian Mahasiswa"
              label="Export"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs rounded-none border-hairline bg-transparent hover:border-ink hover:bg-transparent"
              onClick={() => {
                setLogs([]);
                setStats({ total: 0, processed: 0, pending: 0, failed: 0, lastSync: "kosong" });
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </>
        }
      />

      {/* ─── Metric Strip ─── */}
      <section className="border-t border-hairline">
        <div className="grid gap-px grid-cols-2 lg:grid-cols-4 w-full max-w-full bg-hairline">
            <MetricCard
              icon={Smartphone}
              label="Total Log"
              value={stats.total.toLocaleString()}
              sub={connected ? "Live · semua waktu" : "Semua waktu"}
              badge={connected ? "Live" : "Siaga"}
              number="01"
              delay={0}
            />
            <MetricCard
              icon={CheckCircle2}
              label="Diproses"
              value={stats.processed.toLocaleString()}
              sub={`${syncProgress.toFixed(1)}% dari total`}
              badge="Sukses"
              number="02"
              delay={80}
            />
            <MetricCard
              icon={Clock}
              label="Pending"
              value={stats.pending.toLocaleString()}
              sub="Menunggu antrian"
              badge={stats.pending > 0 ? "Antri" : "Kosong"}
              number="03"
              delay={160}
            />
            <MetricCard
              icon={XCircle}
              label="Sinkronisasi"
              value={stats.lastSync !== "kosong" ? stats.lastSync : "kosong"}
              sub="Update terakhir"
              badge={stats.failed > 0 ? `${stats.failed} Gagal` : "Normal"}
              number="04"
              delay={240}
            />
        </div>
      </section>

      {/* ─── Sync Progress + Log Table ─── */}
      <section className="border-t border-hairline">
        <div className="space-y-px bg-hairline">
          {/* Sync Progress */}
          {stats.total > 0 && (
            <div className="bg-paper">
              <GlassCard>
                <SectionHeader
                  title="Progress Sinkronisasi"
                  sub={`Sinkronisasi terakhir: ${stats.lastSync}`}
                  right={
                    <Badge variant="outline" className="text-xs font-mono">
                      {syncProgress.toFixed(1)}%
                    </Badge>
                  }
                />
                <div className="px-5 py-5 space-y-2">
                  <Progress value={syncProgress} className="h-2" />
                  <div className="flex justify-between text-[10px] text-ink/55">
                    <span>{stats.processed} diproses ({syncProgress.toFixed(1)}%)</span>
                    <span>{stats.pending} pending · {stats.failed} gagal</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Filters & Table */}
          <div className="bg-paper">
            <GlassCard>
              <SectionHeader
                title="Ringkasan Harian"
                sub={`${filtered.length} hari · ${logs.length} buffered`}
                right={
                  <Badge variant="outline" className="text-xs gap-1">
                    {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {connected ? "Stream Aktif" : "Offline"}
                  </Badge>
                }
              />
              <div className="px-5 py-5">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/55" />
                    <Input
                      placeholder="Cari nama atau NIM..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <FilterChipBar
                    label="Tipe"
                    chips={[
                      { id: "App Usage", label: "Penggunaan App", accent: "oklch(0.577 0.245 27.325)" },
                      { id: "Lokasi", label: "Lokasi", accent: "oklch(0.55 0.14 175)" },
                    ]}
                    active={typeFilter !== "all" ? [typeFilter] : []}
                    onToggle={(id) => setTypeFilter(id)}
                    onClear={() => setTypeFilter("all")}
                  />
                  <FilterChipBar
                    label="Status"
                    chips={[
                      { id: "processed", label: "Diproses", accent: "oklch(0.55 0.14 175)" },
                      { id: "pending", label: "Pending", accent: "oklch(0.72 0.16 80)" },
                      { id: "failed", label: "Gagal", accent: "oklch(0.55 0.22 340)" },
                    ]}
                    active={statusFilter !== "all" ? [statusFilter] : []}
                    onToggle={(id) => setStatusFilter(id)}
                    onClear={() => setStatusFilter("all")}
                  />
                </div>

                {filtered.length === 0 ? (
                  <div className="py-8">
                    <EmptyState
                      illustration="no-connection"
                      title={connected ? "Menunggu data real-time..." : "Live log belum aktif"}
                      description={connected
                        ? "Belum ada event masuk dari broker. Aplikasi mobile harus publish via MQTT agar log muncul di sini."
                        : "Pastikan broker MQTT & subscriber berjalan. Cek koneksi di halaman Status."}
                    />
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <SortableHeader label="Mahasiswa" sortKey="student_name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                          </TableHead>
                          <TableHead>
                            <SortableHeader label="Tanggal & Waktu" sortKey="date" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                          </TableHead>
                          <TableHead>
                            <SortableHeader label="Tipe" sortKey="type" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                          </TableHead>
                          <TableHead className="text-right">
                            <SortableHeader label="Screen Time" sortKey="screenTime" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                          </TableHead>
                          <TableHead className="text-right">
                            <SortableHeader label="Sosmed" sortKey="sosmed" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                          </TableHead>
                          <TableHead className="text-right">
                            <SortableHeader label="Game" sortKey="game" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                          </TableHead>
                          <TableHead className="text-right">
                            <SortableHeader label="Unlock" sortKey="unlock" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                          </TableHead>
                          <TableHead>
                            <SortableHeader label="Lokasi" sortKey="location" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortRows(filtered).map((log) => (
                          <TableRow key={log.id} className="hover:bg-ink/[0.025] border-b divider-soft">
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{log.student_name}</p>
                                <p className="text-xs text-ink/55">{log.nim}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{log.date}</p>
                                <p className="text-xs text-ink/55">{log.time || "kosong"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs gap-1">
                                {log.type === "App Usage" ? <Smartphone className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                {log.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{log.screenTime}</TableCell>
                            <TableCell className="text-right text-sm text-ink/55">{log.sosmed}</TableCell>
                            <TableCell className="text-right text-sm text-ink/55">{log.game}</TableCell>
                            <TableCell className="text-right text-sm">{log.unlock > 0 ? `${log.unlock}x` : "kosong"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-xs">
                                <MapPin className="h-3 w-3 text-ink/55" />
                                {log.lokasi}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`eyebrow-sm ${log.status === "processed" ? "text-success" : log.status === "pending" ? "text-warning" : "text-destructive"}`}>
                                {log.status === "processed" ? "Diproses" : log.status === "pending" ? "Pending" : "Gagal"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
