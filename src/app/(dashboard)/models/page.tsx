"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  BarChart3,
  Database,
  DatabaseZap,
  Eye,
  History,
  Play,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Trash2,
  Loader2,
  AlertCircle,
  Zap,
  TrendingUp,
  Target,
  Layers,
  Plus,
} from "lucide-react";
import dynamic from "next/dynamic";
import { triggerTraining, activateModel, apiFetch, getSeedStatus, generateSeedData, clearSeedData, type SeedStatus } from "@/lib/api";
import { CLUSTER_POINTS_LIMIT, MODEL_TRAINING_POLL_MS, MODEL_TRAINING_COMPLETE_DELAY_MS } from "@/lib/limits";
import { clusterPalette } from "@/lib/palette";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// Note: Badge is no longer used for the ML config display — replaced with
// editorial spans (eyebrow + mono value) so the indicator reads as part of
// the type system, not a generic UI pill.
import { Separator } from "@/components/ui/separator";
import { MetricCard, GlassCard, SectionHeader, StatusBadge } from "@/components/metrics";
import { DownloadButton } from "@/components/ui/download-button";
import { SortableHeader, useSort } from "@/components/ui/sortable-header";
import { FilterChipBar } from "@/components/ui/filter-chip-bar";

const ClusterScatterPlot = dynamic(
  () => import("@/components/charts/dashboard-charts").then((m) => m.ClusterScatterPlot),
  { ssr: false, loading: () => <div className="h-[280px] bg-ink/[0.015] animate-pulse" /> }
);
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ModelVersion {
  id: string;
  version_number: number;
  training_date: string;
  dataset_size: number;
  is_active: boolean;
  status: "training" | "completed" | "failed";
  pca_n_components: number;
  kmeans_n_clusters: number;
  silhouette_score: number | null;
  inertia: number | null;
  train_size: number | null;
  test_size: number | null;
  cluster_distribution: Record<string, number>;
  cluster_labels: Record<string, string>;
}

interface ClusterPoint {
  student_id: string;
  full_name: string;
  nim: string;
  pca_x: number;
  pca_y: number;
  cluster_label: number;
  distraction_score: number;
}

interface TrainingProgress {
  phase: string;
  progress: number;
  message: string;
  eta_seconds: number | null;
}

const featureIndicators = [
  { id: "screen_time", label: "Waktu Layar", enabled: true },
  { id: "sosmed_time", label: "Durasi Sosmed", enabled: true },
  { id: "game_time", label: "Durasi Game", enabled: true },
  { id: "unlock_count", label: "Frekuensi Unlock", enabled: true },
  { id: "used_during_class", label: "Penggunaan Saat Kuliah", enabled: true },
  { id: "campus_duration", label: "Durasi di Kampus", enabled: true },
  { id: "schedule_match", label: "Kesesuaian Lokasi vs Jadwal", enabled: true },
];

// clusterDotColor: hex strings for Recharts fill colors — kept separate from editorial badge system
// Round 30 audit (P2): read from clusterPalette (single source of truth in
// src/lib/palette.ts) instead of hardcoded oklch literals. If the palette
// changes, the chart updates automatically instead of going stale.
function clusterDotColor(label: string): string {
  if (label.includes("Rendah")) return clusterPalette[0]  // teal/success
  if (label.includes("Tinggi")) return clusterPalette[2]  // fuchsia/destructive
  return clusterPalette[1]  // amber/warning (Sedang / default)
}

// defaultClusterLabels: server-side pipeline.py uses the same DISTRACTION_LEVELS
// table sorted by cluster mean. Mirror the exact ordered scale here so the
// preview matches what training will produce after admin clicks Simpan Config.
// The user no longer edits labels manually (round 16): labels are auto-generated
// from K, sorted ascending by cluster mean at training time, then persisted to
// ModelVersion.cluster_labels via PUT /api/models/config.
const DISTRACTION_LEVELS = [
  "Sangat Rendah",
  "Rendah",
  "Sedang",
  "Tinggi",
  "Sangat Tinggi",
  "Ekstrem",
] as const;

function defaultClusterLabels(k: number): string[] {
  if (k <= 1) return ["Klaster 1"];
  // K=2..N: take the first K entries from the canonical scale, ordered from
  // lowest to highest distraction. Caps at DISTRACTION_LEVELS.length; K beyond
  // 6 falls back to a generic "Klaster N" suffix so the UI never lies.
  return Array.from({ length: k }, (_, i) =>
    DISTRACTION_LEVELS[i] ?? `Klaster ${i + 1}`
  );
}

function defaultClusterLabelsMap(k: number): Record<string, string> {
  const map: Record<string, string> = {};
  defaultClusterLabels(k).forEach((label, i) => {
    map[String(i)] = label;
  });
  return map;
}

// ─── Training Progress Card ─────────────────────────────────────────────────

function TrainingProgressCard({
  progress,
  onComplete,
}: {
  progress: TrainingProgress | null;
  onComplete: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!startRef.current) startRef.current = Date.now();
    if (!progress) {
      // Reset training-progress timer to zero. Single setState to clear
      // stale state when the parent stops feeding new progress events.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsed(0);
      startRef.current = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [progress]);

  // Round 26 audit (P1): the original setTimeout at line 181 had no
  // captured handle, so navigating away during the 2-second wait would
  // fire onComplete() against a stale (or unmounted) component — causing
  // a setState-on-unmounted warning + a wasted `loadModels()` fetch.
  // Capture the id in a ref and clear it in the cleanup function.
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (progress && progress.progress >= 100) {
      completeTimerRef.current = setTimeout(
        onComplete,
        MODEL_TRAINING_COMPLETE_DELAY_MS,
      );
    }
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
    };
  }, [progress, onComplete]);

  if (!progress) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const phases = ["Memuat Data", "Preprocessing", "PCA Fitting", "K-Means"];
  const steps = ["load", "preprocess", "pca", "kmeans"];
  const currentStep = steps.indexOf(progress.phase.toLowerCase().replace(/ /g, "_"));

  return (
    <div className="editorial-panel border-l-2 border-l-warning p-5 animate-fade-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Loader2 className="h-6 w-6 text-warning animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="display-sans text-base text-ink leading-tight">
              Training Sedang Berlangsung
            </p>
            <span className="eyebrow-sm text-warning gap-1 inline-flex items-center">
              <Zap className="h-3 w-3" />
              Real-time
            </span>
          </div>
          <p className="text-xs text-ink/55 mt-1">
            {progress.message} · {formatTime(elapsed)} elapsed
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink/85">
              {phases[Math.max(0, currentStep)]}
            </span>
            <span className="font-mono text-ink/55">
              {progress.progress}%
            </span>
          </div>
          <Progress
            value={progress.progress}
            className="h-2 [&>div]:bg-warning"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {phases.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step} className="text-center">
                <div
                  className={`h-1.5 mb-1.5 transition-all ${
                    done
                      ? "bg-success"
                      : active
                      ? "bg-warning animate-pulse"
                      : "bg-ink/15"
                  }`}
                />
                <p className={`eyebrow-sm ${active ? "text-warning" : "text-ink/45"}`}>
                  {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}

// ─── Realtime Metrics ─────────────────────────────────────────────────────────

// (Component removed: previously rendered a live silhouette-score delta
// indicator but was never referenced in the page tree.)

// ─── Scatter Plot ─────────────────────────────────────────────────────────────

// CLUSTER_PALETTE moved to components/charts/dashboard-charts.tsx (lazy-loaded)

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ModelsPage() {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [pcaComponents, setPcaComponents] = useState(2);
  const [kClusters, setKClusters] = useState(3);
  const [indicators, setIndicators] = useState(featureIndicators);
  const [connected, setConnected] = useState(false);
  const [clusterPoints, setClusterPoints] = useState<ClusterPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStartRef = useRef<number>(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "training">("all");

  const { key: sortKey, dir: sortDir, toggle: toggleSort, sorted: sortedVersions } = useSort<ModelVersion>("version_number", "desc");

  const activeModel = models.find((v) => v.is_active && v.status === "completed");
  const activeModelId = activeModel?.id;

  async function loadModels(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ModelVersion[]>("/api/models/history", { signal });
      setModels(data);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Gagal memuat model. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function startPolling() {
    // Round 29 audit P1: defensive — clear any existing interval before
    // creating a new one. The `disabled={training}` guard on the Train
    // button prevents normal double-click, but a fast programmatic call
    // (e.g. retraining immediately after a finished run) would overlap
    // intervals and 2-3x the polling load on /api/models/history.
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingStartRef.current = Date.now();
    pollingRef.current = setInterval(async () => {
      try {
        const data = await apiFetch<ModelVersion[]>("/api/models/history");
        setModels(data);
        const training = data.find((v) => v.status === "training");
        if (!training) {
          stopPolling();
          setTraining(false);
          setTrainingProgress({
            phase: "complete",
            progress: 100,
            message: "Training selesai!",
            eta_seconds: null,
          });
          toast.success("Training model selesai!");
        } else {
          const elapsed = Math.floor((Date.now() - pollingStartRef.current) / 1000);
          const progress = Math.min(95, Math.floor(elapsed / 3));
          setTrainingProgress({
            phase: progress < 25 ? "load" : progress < 50 ? "preprocess" : progress < 80 ? "pca" : "kmeans",
            progress,
            message: `Model v${training.version_number} sedang dilatih...`,
            eta_seconds: null,
          });
        }
      } catch {
        // silent
      }
    }, MODEL_TRAINING_POLL_MS);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  // WebSocket connection status
  useEffect(() => {
    // Round 29 audit P1: replaced the no-op WebSocket subscription (which
    // opened a full WS connection just to flip a status badge) with a
    // simple health check. The previous code also set `setConnected(true)`
    // synchronously *before* the WS handshake completed, so any failure
    // (401, network) left the badge showing "online" until unmount.
    let cancelled = false
    const ctrl = new AbortController()
    fetch("/api/status", { credentials: "include", signal: ctrl.signal })
      .then((r) => { if (!cancelled && r.ok) setConnected(true) })
      .catch(() => { if (!cancelled) setConnected(false) })
    return () => {
      cancelled = true
      ctrl.abort()
      setConnected(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController();
    // Initial model list load on mount — setState happens inside loadModels
    // (async), not synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadModels(ctrl.signal);
    return () => {
      ctrl.abort();
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (!activeModelId) return;
    const ctrl = new AbortController();
    async function loadClusterPoints() {
      setLoadingPoints(true);
      try {
        const data = await apiFetch<ClusterPoint[]>(
          `/api/models/results/points?limit=${CLUSTER_POINTS_LIMIT}`,
          { signal: ctrl.signal }
        );
        if (!ctrl.signal.aborted) setClusterPoints(data);
      } catch (e) {
        if (ctrl.signal.aborted || (e instanceof Error && e.name === "AbortError")) return;
        toast.error("Gagal memuat data cluster points");
      } finally {
        if (!ctrl.signal.aborted) setLoadingPoints(false);
      }
    }
    // Reload cluster scatter whenever the active model changes.
    void loadClusterPoints();
    return () => ctrl.abort();
  }, [activeModelId]);

  async function runTraining() {
    setTraining(true);
    setTrainingProgress({
      phase: "load",
      progress: 5,
      message: "Memulai training model...",
      eta_seconds: null,
    });
    pollingStartRef.current = Date.now();
    try {
      const result = await triggerTraining({
        pca_n_components: pcaComponents,
        kmeans_n_clusters: kClusters,
      });
      toast.success(result.message);
      startPolling();
    } catch (e: unknown) {
      const raw = e instanceof Error ? (e.message || String(e)) : String(e);
      // Strip server prefix
      const msg = raw.replace(/^Training (?:gagal|failed)[:\s]*/i, "");
      // User-friendly messages for known error patterns
      if (msg.includes("Tidak ada data log") || msg.includes("Data tidak cukup") || msg.includes("tidak ada variasi")) {
        toast.error(msg);
      } else if (msg.includes("Number of labels")) {
        toast.error("Data terlalu sedikit untuk clustering. Butuh lebih banyak data log dari mahasiswa.");
      } else {
        toast.error(msg);
      }
      setTraining(false);
      setTrainingProgress(null);
      stopPolling();
    }
  }

  function handleTrainingComplete() {
    setTrainingProgress(null);
    setTraining(false);
    stopPolling();
    loadModels();
  }

  async function saveConfig() {
    // Auto-generate labels per K and send them with the config so the
    // server-side ModelVersion.cluster_labels map matches what training will
    // produce after Simpan Config + Latih. Manual editing was removed (round
    // 16): the preview below shows the canonical scale and saving persists it.
    const payload = {
      pca_n_components: pcaComponents,
      kmeans_n_clusters: kClusters,
      cluster_labels: defaultClusterLabelsMap(kClusters),
    };
    try {
      await apiFetch("/api/models/config", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.success(`Config saved: PCA=${pcaComponents}, K-Means=${kClusters}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save config");
    }
  }

  const toggleIndicator = useCallback((id: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  }, []);

  const totalRecords = activeModel?.dataset_size ?? 0;

  return (
    <div className="space-y-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-up">
        <div className="flex items-center gap-2 min-w-0">
          {activeModel && (
            <StatusBadge type="active" label={`v${activeModel.version_number}`} />
          )}
          <h1 className="text-2xl font-bold tracking-tight text-ink">Model ML</h1>
          {activeModel && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/55">
              <span className="h-1.5 w-1.5 rounded-full bg-ink/40" />
              {activeModel.pca_n_components}D / {activeModel.kmeans_n_clusters} · Konfigurasi aktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge type={connected ? "active" : "inactive"} label={connected ? "Terhubung" : "Terputus"} />
          <Button size="sm" onClick={runTraining} disabled={training} className="gap-1.5 h-8 rounded-none">
            {training ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {training ? "Training..." : "Jalankan Training"}
          </Button>
        </div>
      </div>

      {/* Training Progress */}
      <TrainingProgressCard
        progress={trainingProgress}
        onComplete={handleTrainingComplete}
      />

      {error && (
        <div className="editorial-panel border-l-2 border-l-destructive p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="display text-sm text-ink leading-tight">Gagal memuat data mining API</p>
            <p className="text-xs text-ink/55 mt-1">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => loadModels()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />Coba Lagi
          </Button>
        </div>
      )}

      {/* Metric Cards */}
      <section className="border-t border-hairline">
        <div className="grid gap-px grid-cols-2 lg:grid-cols-4 w-full max-w-full bg-hairline">
            <MetricCard
              icon={Eye}
              label="Model Aktif"
              value={activeModel ? `v${activeModel.version_number}` : "kosong"}
              sub={activeModel?.status === "completed" ? "Training selesai" : "Belum dilatih"}
              badge={activeModel?.status === "completed" ? "Aktif" : "Siaga"}
              badgeType={activeModel?.status === "completed" ? "completed" : "training"}
              number="01"
              delay={0}
            />
            <MetricCard
              icon={BarChart3}
              label="Dataset"
              value={activeModel ? activeModel.dataset_size.toLocaleString() : "kosong"}
              sub="Jumlah data latih"
              badge="Aktif"
              badgeType="active"
              number="02"
              delay={80}
            />
            <MetricCard
              icon={TrendingUp}
              label="Silhouette Score"
              value={activeModel?.silhouette_score != null ? activeModel.silhouette_score.toFixed(4) : "kosong"}
              sub="Kualitas clustering"
              badge={activeModel?.silhouette_score && activeModel.silhouette_score > 0.4 ? "Baik" : "Standar"}
              badgeType={activeModel?.silhouette_score && activeModel.silhouette_score > 0.4 ? "completed" : "active"}
              number="03"
              delay={160}
            />
            <MetricCard
              icon={Layers}
              label="PCA / K-Means"
              value={activeModel ? `${activeModel.pca_n_components}D / ${activeModel.kmeans_n_clusters}` : "kosong"}
              sub="Konfigurasi aktif"
              badge="Config"
              badgeType="active"
              number="04"
              delay={240}
            />
        </div>
      </section>

      {/* Seed Data Panel */}
      <section className="bg-paper border-t border-hairline">
        <div className="space-y-px bg-hairline">
          <div className="bg-paper">
            <SeedDataPanel />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-paper border-t border-hairline">
        <div className="space-y-px bg-hairline">
          <Tabs defaultValue="config">
            <TabsList>
              <TabsTrigger value="config" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />Konfigurasi
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />Riwayat
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />Preview
              </TabsTrigger>
            </TabsList>

            {/* ─── Config Tab ─── */}
            <TabsContent value="config" className="mt-4">
              <div className="bg-paper">
                <div className="grid gap-px lg:grid-cols-2 w-full max-w-full bg-hairline">
                  <div className="bg-paper">
                    <GlassCard>
                      <SectionHeader
                        number="01"
                        title="Parameter ML"
                        titleIcon={<Settings className="h-4 w-4 text-ink/55 -mt-1" />}
                        sub="Pengaturan PCA & K-Means"
                      />
                      <div className="px-5 py-5 space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5 text-ink/55" />Komponen PCA
                            </Label>
                            {/* Editorial indicator: small mono value next to a
                                numbered eyebrow. Replaces the previous Badge
                                variant="outline" so the chip reads as part of
                                the type system instead of a generic UI pill. */}
                            <span className="inline-flex items-baseline gap-2">
                              <span className="eyebrow-sm text-ink/45">Nilai</span>
                              <span className="font-mono text-sm font-semibold text-ink tabular-nums">{pcaComponents}</span>
                            </span>
                          </div>
                          <Select value={String(pcaComponents)} onValueChange={(v) => v && setPcaComponents(Number(v))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2D, Scatter 2D</SelectItem>
                              <SelectItem value="3">3D, Scatter 3D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5 text-ink/55" />Jumlah Klaster (K)
                            </Label>
                            <span className="inline-flex items-baseline gap-2">
                              <span className="eyebrow-sm text-ink/45">Nilai</span>
                              <span className="font-mono text-sm font-semibold text-ink tabular-nums">{kClusters}</span>
                            </span>
                          </div>
                          <Select value={String(kClusters)} onValueChange={(v) => v && setKClusters(Number(v))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2 Klaster</SelectItem>
                              <SelectItem value="3">3 Klaster (R/S/T)</SelectItem>
                              <SelectItem value="4">4 Klaster</SelectItem>
                              <SelectItem value="5">5 Klaster</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator />
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={saveConfig} variant="outline">Simpan</Button>
                          <Button className="flex-1" onClick={runTraining} disabled={training}>
                            {training ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            {training ? "Melatih..." : "Latih"}
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div className="bg-paper space-y-px">
                    <GlassCard>
                      <SectionHeader
                        number="02"
                        title="Indikator Fitur"
                        sub="Fitur yang dipakai dalam clustering"
                      />
                      <div className="px-5 py-5 space-y-3">
                        {indicators.map((ind) => (
                          <div key={ind.id} className="flex items-center justify-between">
                            <Label className="text-sm cursor-pointer" onClick={() => toggleIndicator(ind.id)}>
                              {ind.label}
                            </Label>
                            <Switch checked={ind.enabled} onCheckedChange={() => toggleIndicator(ind.id)} />
                          </div>
                        ))}
                        <Separator />
                        <p className="text-[10px] text-ink/55">
                          {indicators.filter((i) => i.enabled).length}/{indicators.length} indikator aktif
                        </p>
                      </div>
                    </GlassCard>

                    {activeModel && (
                      <GlassCard className="lg:col-span-2">
                        <div className="px-5 pt-4 pb-4 border-b border-hairline">
                          <div className="flex items-baseline gap-3 mb-2">
                            <span className="display-sans text-2xl tabular-nums text-ink leading-none">
                              03
                            </span>
                            <span className="eyebrow-sm text-ink/45">Section</span>
                          </div>
                          <h3 className="display-sans-black text-2xl sm:text-3xl text-ink leading-[1.05] uppercase sm:normal-case">
                            Label Klaster
                          </h3>
                          <p className="text-[11px] text-ink/55 mt-2 leading-relaxed max-w-prose">
                            Label dihasilkan otomatis dari skala distraksi
                            berdasarkan nilai K. Preview di bawah mengikuti
                            label yang akan disimpan saat Anda klik Simpan Config.
                          </p>
                        </div>
                        <div className="px-5 py-5">
                          <div className="grid gap-3 md:grid-cols-3">
                            {defaultClusterLabels(kClusters).map((label, i) => {
                              // Hint text follows the editorial dot color so
                              // each row telegraphs its distraction tier at a
                              // glance without a colored fill.
                              const isRendah = label.toLowerCase().includes("rendah");
                              const isTinggi = label.toLowerCase().includes("tinggi");
                              const hint = isRendah
                                ? "Screen time & distraksi rendah"
                                : isTinggi
                                ? "Screen time & distraksi tinggi"
                                : "Tingkat distraksi sedang";
                              return (
                                <div
                                  key={i}
                                  className="flex items-start gap-3 px-4 py-3 border-t border-hairline"
                                >
                                  <span
                                    className="inline-block h-2 w-2 rounded-full mt-1.5 shrink-0"
                                    style={{ backgroundColor: clusterDotColor(label) }}
                                    aria-hidden
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="eyebrow-sm text-ink/45 tabular-nums">
                                      {(i + 1).toString().padStart(2, "0")} · Klaster {i + 1}
                                    </p>
                                    <p className="display-sans text-sm text-ink mt-1 leading-tight">
                                      {label}
                                    </p>
                                    <p className="text-[10px] text-ink/55 mt-1 leading-snug">
                                      {hint}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-5 pt-4 border-t border-hairline flex items-center gap-2">
                            <span className="eyebrow-sm text-ink/45">Catatan</span>
                            <span className="text-[11px] text-ink/60">
                              Label final ditetapkan saat training selesai,
                              diurutkan menaik dari rata-rata distraksi per klaster.
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ─── History Tab ─── */}
            <TabsContent value="history" className="mt-4">
              <div className="bg-paper">
                <GlassCard>
                  <SectionHeader
                    number="01"
                    title="Riwayat Versi Model"
                    sub={`${models.length} versi · data realtime`}
                    right={
                      <div className="flex items-center gap-2">
                        <DownloadButton
                          filename="riwayat-model"
                          data={models.map((m) => ({
                            versi: `v${m.version_number}`,
                            tanggal: m.training_date,
                            dataset: m.dataset_size,
                            pca: m.pca_n_components,
                            kmeans: m.kmeans_n_clusters,
                            silhouette: m.silhouette_score != null ? m.silhouette_score.toFixed(4) : "kosong",
                            status: m.status,
                            aktif: m.is_active ? "Ya" : "Tidak",
                          }))}
                          columns={[
                            { key: "versi", label: "Versi" },
                            { key: "tanggal", label: "Tanggal Training" },
                            { key: "dataset", label: "Dataset Size" },
                            { key: "pca", label: "PCA Components" },
                            { key: "kmeans", label: "K-Means K" },
                            { key: "silhouette", label: "Silhouette Score" },
                            { key: "status", label: "Status" },
                            { key: "aktif", label: "Aktif" },
                          ]}
                          title="Riwayat Versi Model ML"
                        />
                        <Button variant="outline" size="sm" onClick={() => loadModels()} disabled={loading}>
                          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />Refresh
                        </Button>
                      </div>
                    }
                  />
                  <div className="px-5 pb-5">
                    {loading ? (
                      <SkeletonTable rows={8} cols={8} />
                    ) : models.length === 0 ? (
                      <div className="py-8">
                        <EmptyState
                          illustration="models"
                          title="Belum ada model"
                          description="Jalankan training manual dari panel Parameter ML untuk menghasilkan model PCA + K-Means pertama."
                        />
                      </div>
                    ) : (
                      <>
                        <FilterChipBar
                          label="Status"
                          chips={[
                            { id: "all", label: "Semua" },
                            { id: "completed", label: "Berhasil", accent: "oklch(0.55 0.14 175)" },
                            { id: "failed", label: "Gagal", accent: "oklch(0.55 0.22 340)" },
                            { id: "training", label: "Pending", accent: "oklch(0.72 0.16 80)" },
                          ]}
                          active={statusFilter !== "all" ? [statusFilter] : []}
                          onToggle={(id) => setStatusFilter(id as typeof statusFilter)}
                          onClear={() => setStatusFilter("all")}
                          className="mb-4"
                        />
                        {sortedVersions(models.filter(v => statusFilter === "all" || v.status === statusFilter)).length === 0 ? (
                          <div className="py-8 text-center text-sm text-ink/55">
                            Tidak ada model dengan status yang dipilih
                          </div>
                        ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead><SortableHeader label="Versi" sortKey="version_number" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} /></TableHead>
                              <TableHead><SortableHeader label="Tanggal" sortKey="training_date" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} /></TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right"><SortableHeader label="Dataset" sortKey="dataset_size" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" /></TableHead>
                              <TableHead className="text-right"><SortableHeader label="Silhouette" sortKey="silhouette_score" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" /></TableHead>
                              <TableHead className="text-right">Inertia</TableHead>
                              <TableHead className="text-right">PCA / K</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedVersions(models.filter(v => statusFilter === "all" || v.status === statusFilter)).map((m) => (
                            <TableRow
                              key={m.id}
                              className={m.is_active ? "bg-ink/[0.02]" : ""}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-semibold">v{m.version_number}</span>
                                  {m.is_active && (
                                    <StatusBadge type="completed" label="Aktif" />
                                  )}
                                  {m.status === "training" && (
                                    <StatusBadge type="active" label="Melatih" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-ink/55">
                                {new Date(m.training_date).toLocaleString("id-ID", {
                                  day: "numeric", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                {m.status === "completed" && (
                                  <StatusBadge type="completed" label="Completed" />
                                )}
                                {m.status === "failed" && (
                                  <StatusBadge type="failed" label="Failed" />
                                )}
                                {m.status === "training" && (
                                  <StatusBadge type="active" label="Melatih" />
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {m.status === "completed" ? m.dataset_size.toLocaleString() : "kosong"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {m.silhouette_score?.toFixed(4) ?? "kosong"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {m.inertia?.toFixed(0) ?? "kosong"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-ink/55">
                                {m.pca_n_components}D / {m.kmeans_n_clusters}
                              </TableCell>
                              <TableCell>
                                {!m.is_active && m.status === "completed" && (
                                  <Button variant="ghost" size="sm" className="h-7 text-xs"
                                    onClick={async () => {
                                      try {
                                        await activateModel(m.id);
                                        toast.success(`Model v${m.version_number} diaktifkan`);
                                        loadModels();
                                      } catch (e) {
                                        toast.error(e instanceof Error ? e.message : "Gagal mengaktifkan model");
                                      }
                                    }}>
                                    Set Aktif
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                        )}
                      </>
                    )}
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            {/* ─── Preview Tab ─── */}
            <TabsContent value="preview" className="mt-4">
              <section className="bg-paper">
                <GlassCard>
                  <SectionHeader
                    number="01"
                    title="Preview Konfigurasi Aktif"
                    sub={
                      activeModel
                        ? `Model v${activeModel.version_number} · ${activeModel.dataset_size.toLocaleString()} record · PCA ${activeModel.pca_n_components}D · K=${activeModel.kmeans_n_clusters}`
                        : "Jalankan training untuk melihat hasil"
                    }
                    right={
                      <div className="flex items-center gap-2">
                        {connected && (
                          <StatusBadge type="active" label="Live" />
                        )}
                        {loadingPoints && (
                          <Loader2 className="h-4 w-4 animate-spin text-ink/55" />
                        )}
                      </div>
                    }
                  />
                  {/* Configuration summary — 4-cell hairline grid showing the
                      active model's hyperparameters + quality metrics at a glance.
                      Each cell mirrors the editorial metric strip pattern so it
                      reads as a continuation of the dashboard. */}
                  {activeModel && (
                    <div className="border-t border-hairline">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
                        {[
                          { k: "01", label: "PCA Components", value: `${activeModel.pca_n_components}D`, sub: "Dimensi reduksi" },
                          { k: "02", label: "K-Means K", value: `${activeModel.kmeans_n_clusters}`, sub: "Jumlah klaster" },
                          { k: "03", label: "Skor Silhouette", value: activeModel.silhouette_score?.toFixed(3) ?? "kosong", sub: "Skor kualitas" },
                          { k: "04", label: "Dataset", value: activeModel.dataset_size.toLocaleString(), sub: "Total record" },
                        ].map((c, i) => (
                          <div key={c.k} className="bg-paper px-5 py-4 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="eyebrow-sm tabular-nums text-ink">{c.k}</span>
                              <span className="eyebrow-sm text-ink/45">Config</span>
                            </div>
                            <p className="display-sans text-2xl text-ink leading-tight">{c.value}</p>
                            <p className="text-[11px] text-ink/55 mt-1.5">{c.label}</p>
                            <p className="text-[10px] text-ink/40 mt-0.5">{c.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="px-5 py-5">
                    {activeModel ? (
                      <div className="space-y-5">
                        {/* Cluster distribution bars */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="eyebrow text-ink">Distribusi Klaster</span>
                            <span className="eyebrow-sm text-ink/45 tabular-nums">{totalRecords.toLocaleString()} total</span>
                          </div>
                          {Object.entries(activeModel.cluster_distribution ?? {}).map(([k, count]) => {
                            const label = activeModel.cluster_labels?.[k] ?? `Klaster ${k}`;
                            const pct = ((Number(count) / totalRecords) * 100).toFixed(1);
                            const color = clusterDotColor(label);
                            return (
                              <div key={k} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-ink">{label}</span>
                                  <span className="text-ink/55 font-mono tabular-nums">
                                    {Number(count).toLocaleString()} <span className="text-ink/40">({pct}%)</span>
                                  </span>
                                </div>
                                <div className="h-1.5 bg-ink/[0.06] overflow-hidden">
                                  <div
                                    className="h-full transition-all duration-700"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Scatter Plot */}
                        <ClusterScatterPlot
                          points={clusterPoints}
                          clusterLabels={activeModel.cluster_labels ?? {}}
                        />

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-3">
                          <div className="border p-3 text-center">
                            <p className="text-2xl font-bold">
                              {activeModel.silhouette_score?.toFixed(4) ?? "kosong"}
                            </p>
                            <p className="text-[10px] text-ink/55">Silhouette</p>
                          </div>
                          <div className="border p-3 text-center">
                            <p className="text-2xl font-bold">
                              {activeModel.inertia?.toFixed(0) ?? "kosong"}
                            </p>
                            <p className="text-[10px] text-ink/55">K-Means Inertia</p>
                          </div>
                          <div className="border p-3 text-center">
                            <p className="text-2xl font-bold">
                              {activeModel.train_size?.toLocaleString() ?? "kosong"}
                            </p>
                            <p className="text-[10px] text-ink/55">Train Size</p>
                          </div>
                          <div className="border p-3 text-center">
                            <p className="text-2xl font-bold">
                              {activeModel.test_size?.toLocaleString() ?? "kosong"}
                            </p>
                            <p className="text-[10px] text-ink/55">Test Size</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-hairline">
                        <BarChart3 className="h-12 w-12 mx-auto text-ink/20" />
                        <p className="text-sm text-ink/55 mt-3">Jalankan training untuk melihat hasil</p>
                        <Button className="mt-3 rounded-none" size="sm" onClick={runTraining} disabled={training}>
                          <Play className="mr-2 h-4 w-4" />
                          {training ? "Training..." : "Jalankan Training"}
                        </Button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

// ─── Seed Data Panel ────────────────────────────────────────────────────────────

function SeedDataPanel() {
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const s = await getSeedStatus();
      setStatus(s);
    } catch {
      // admin only — silently fail for non-admins
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial seed-status load on mount; setState is inside the async fn.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateSeedData();
      toast.success(
        `${result.logs_created.toLocaleString()} log dibuat untuk ${result.students_created} mahasiswa. Total: ${result.total_logs.toLocaleString()} log.`
      );
      await loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal generate data");
    } finally {
      setGenerating(false);
    }
  }

  async function handleClear() {
    if (!confirm("Hapus semua seed data (mahasiswa + log)? Ini tidak bisa di-undo.")) return;
    setClearing(true);
    try {
      const result = await clearSeedData();
      toast.success(`${result.logs_cleared.toLocaleString()} log dihapus.`);
      await loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal clear data");
    } finally {
      setClearing(false);
    }
  }

  if (loading) return null;
  if (!status) return null;

  return (
    <GlassCard>
      <SectionHeader
        title="Data Seed"
        sub="15 mahasiswa + ~10.000 log siap mining"
        right={
          <div className="flex items-center gap-2">
            {status.seed_data_ready ? (
              <StatusBadge type="completed" label={`${status.logs_from_seed.toLocaleString()} log`} />
            ) : (
              <StatusBadge type="active" label="Belum ada seed data" />
            )}
          </div>
        }
      />
      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Mahasiswa", value: status.students_in_db },
            { label: "Total Log", value: status.logs_in_db, icon: DatabaseZap },
            { label: "Log Seed", value: status.logs_from_seed, icon: Database },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2.5">
              {Icon && <Icon className="h-4 w-4 text-ink/55" />}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/55">
                  {label}
                </p>
                <p className="text-base font-bold tabular-nums">
                  {value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="gap-1.5 flex-1"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {generating ? "Membuat..." : "Buat Data Seed"}
          </Button>
          {status.logs_from_seed > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={clearing}
              className="gap-1.5 text-destructive hover:bg-destructive/10"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {clearing ? "Menghapus..." : "Hapus"}
            </Button>
          )}
        </div>

        <p className="text-[10px] text-ink/40 mt-2">
          Seed: 15 mahasiswa (5 Rendah, 5 Sedang, 5 Tinggi distraksi) × 53 hari × ~12 sesi/hari ≈ 10.000 log
        </p>
      </div>
    </GlassCard>
  );
}
