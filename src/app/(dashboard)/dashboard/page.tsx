"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Activity, ArrowRight, BrainCircuit, ChartColumn, Clock3, MapPin, MapPinOff, RefreshCw, Smartphone, Hourglass, Users } from "lucide-react";
import { getClusterTrends, getDashboardSummary, getGeofenceSummary, getModelHistory, getScreenTimeTrends, subscribeLogsStreamWebSocket } from "@/lib/api";
import { useUserProfile } from "@/lib/user-profile";
import { useInstitution } from "@/lib/institution";
import { useApiResource } from "@/hooks/use-api-resource";
import { GlassCard, SectionHeader, MetricCard, PageHeader } from "@/components/metrics";
import { Button } from "@/components/ui/button";
import { DataState } from "@/components/ui/data-state";
import { DownloadButton } from "@/components/ui/download-button";
import { Skeleton } from "@/components/ui/skeleton";

const ScreenTimeChart = dynamic(() => import("@/components/charts/dashboard-charts").then(module => module.ScreenTimeChart), { ssr: false, loading: () => <Skeleton height={320} aria-label="Memuat grafik" /> });
const ClusterTrendChart = dynamic(() => import("@/components/charts/dashboard-charts").then(module => module.ClusterTrendChart), { ssr: false, loading: () => <Skeleton height={320} aria-label="Memuat grafik" /> });
const loadSummary = (signal: AbortSignal) => getDashboardSummary(signal);
const loadDaily = (signal: AbortSignal) => getScreenTimeTrends(7, signal);
const loadWeekly = (signal: AbortSignal) => getClusterTrends("weekly", 4, signal);
const loadMonthly = (signal: AbortSignal) => getClusterTrends("monthly", 6, signal);
const loadGeofence = (signal: AbortSignal) => getGeofenceSummary(7, signal);
const loadModels = (signal: AbortSignal) => getModelHistory({ signal });
const number = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

export default function DashboardPage() {
  const summary = useApiResource(loadSummary);
  const daily = useApiResource(loadDaily);
  const weekly = useApiResource(loadWeekly);
  const monthly = useApiResource(loadMonthly);
  const geofence = useApiResource(loadGeofence);
  const models = useApiResource(loadModels);
  const { profile } = useUserProfile();
  const { profile: institution } = useInstitution();
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState({ logs: 0, locations: 0, time: "Belum ada pembaruan" });

  useEffect(() => subscribeLogsStreamWebSocket(event => {
    if (event.event === "connected" || event.event === "disconnected") {
      setConnected(event.event === "connected");
    } else if (event.student_id && (event.type === "app_log" || event.type === "location_log")) {
      setLive(previous => ({
        logs: previous.logs + (event.type === "app_log" ? 1 : 0),
        locations: previous.locations + (event.type === "location_log" ? 1 : 0),
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" }) + " WITA",
      }));
    }
  }), []);

  const resources = [summary, daily, weekly, monthly, geofence, models];
  const busy = resources.some(resource => resource.pending);
  const stats = summary.data;
  const summaryStart = stats ? new Date(new Date(`${stats.date}T00:00:00Z`).getTime() - 7 * 86400000).toISOString().slice(0, 10) : null;
  const summaryPeriod = stats ? `${summaryStart} s.d. ${stats.date} (WITA)` : "Periode mingguan";
  const location = geofence.data;
  const latestModel = models.data?.[0];
  const activeModel = models.data?.find(model => model.is_active);
  const locationKnown = location ? location.inside + location.outside : 0;
  const downloadData: Record<string, unknown>[] = [
    ...(stats ? [
      { kategori: "Mahasiswa terdaftar", nilai: stats.total_registered, satuan: "mahasiswa", periode: "Saat ini" },
      { kategori: "Sudah sinkron", nilai: stats.active_students_week, satuan: "mahasiswa", periode: summaryPeriod },
      { kategori: "Belum sinkron", nilai: stats.pending_students, satuan: "mahasiswa", periode: summaryPeriod },
      { kategori: "Rerata waktu layar", nilai: stats.avg_screen_time_today_min, satuan: "menit", periode: stats.date },
      { kategori: "Rerata log mobile per mahasiswa", nilai: stats.avg_unlock_count_today, satuan: "log", periode: stats.date },
      { kategori: "Data sinkronisasi mahasiswa-hari", nilai: stats.app_logs_week, satuan: "baris", periode: summaryPeriod },
      { kategori: "Log data simulasi", nilai: stats.seed_logs_week, satuan: "log", periode: summaryPeriod },
    ] : []),
    ...(location ? [
      { kategori: "Log di area kampus", nilai: location.inside, satuan: "log", periode: `${location.days} hari terakhir` },
      { kategori: "Log di luar area kampus", nilai: location.outside, satuan: "log", periode: `${location.days} hari terakhir` },
      { kategori: "Log tanpa lokasi", nilai: location.unknown, satuan: "log", periode: `${location.days} hari terakhir` },
      ...(locationKnown ? [{ kategori: "Proporsi log di area kampus", nilai: Math.round(location.inside_rate * 1000) / 10, satuan: "% dari log dengan lokasi", periode: `${location.days} hari terakhir` }] : []),
    ] : []),
    ...(activeModel ? [
      { kategori: "Model aktif", nilai: activeModel.version_number, satuan: "versi", periode: activeModel.training_date },
      { kategori: "Data pelatihan", nilai: activeModel.dataset_size, satuan: "baris", periode: activeModel.training_date },
      { kategori: "Komponen PCA", nilai: activeModel.pca_n_components, satuan: "komponen", periode: activeModel.training_date },
      { kategori: "Jumlah kelompok", nilai: activeModel.kmeans_n_clusters, satuan: "kelompok", periode: activeModel.training_date },
      { kategori: "Kualitas pemisahan kelompok", nilai: activeModel.silhouette_score ?? "Belum tersedia", satuan: "skor silhouette", periode: activeModel.training_date },
      ...Object.entries(activeModel.cluster_distribution ?? {}).map(([id, count]) => ({ kategori: activeModel.cluster_labels?.[id] ?? `Kelompok ${id}`, nilai: count, satuan: "data pelatihan", periode: activeModel.training_date })),
    ] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Ringkasan aktivitas belajar" subtitle="Pantau keterisian data, pahami pola, lalu tentukan tindak lanjut." connected={connected} rightActions={<div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => resources.forEach(resource => resource.reload())} disabled={busy} className="min-h-11 gap-2 bg-card"><RefreshCw className={busy ? "size-4 animate-spin motion-reduce:animate-none" : "size-4"} aria-hidden="true" />{busy ? "Memuat..." : "Perbarui"}</Button>
        {downloadData.length > 0 && !busy && <DownloadButton data={downloadData} columns={[{ key: "kategori", label: "Kategori" }, { key: "nilai", label: "Nilai" }, { key: "satuan", label: "Satuan" }, { key: "periode", label: "Periode" }]} filename="ringkasan-monitor-ung" title="Ringkasan Aktivitas Belajar" label="Unduh ringkasan" className="min-h-11 gap-2 rounded-lg bg-card text-sm" institution={{ name: institution.universityName || "Universitas Negeri Gorontalo", faculty: institution.faculty, program: institution.program }} downloadedBy={{ name: profile.fullName, role: profile.role }} />}
      </div>} />

      <section aria-label="Ringkasan mahasiswa" aria-busy={summary.pending}>
        <p className="mb-3 text-sm text-muted-foreground">Periode sinkronisasi: {summaryPeriod}</p>
        <DataState error={summary.error} onRetry={summary.reload}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users} label="Mahasiswa terdaftar" value={stats ? number(stats.total_registered) : null} sub="Seluruh mahasiswa terdaftar" pending={summary.pending} />
            <MetricCard icon={Smartphone} label="Sudah sinkron" value={stats ? number(stats.active_students_week) : null} sub="Mahasiswa dengan data mobile, periode mingguan" pending={summary.pending} />
            <MetricCard icon={Hourglass} label="Belum sinkron" value={stats ? number(stats.pending_students) : null} sub="Belum mengirim data mobile pada periode mingguan" pending={summary.pending} />
            <MetricCard icon={Clock3} label="Rerata waktu layar" value={stats ? `${number(stats.avg_screen_time_today_min)} mnt` : null} sub={stats ? `Hari ini (${stats.date}), WITA` : "Rata-rata hari ini, WITA"} pending={summary.pending} />
          </div>
        </DataState>
      </section>

      {latestModel?.status === "failed" && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-ink">Pelatihan model v{latestModel.version_number} terakhir gagal. Hasil baru mungkin belum tersedia.</p>
        <Link href="/models" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">Periksa model<ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>}

      <section className="dashboard-panel dashboard-follow-up flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between" aria-labelledby="follow-up-title">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold text-ink">Langkah berikutnya</p>
          <h2 id="follow-up-title" className="font-heading text-xl font-bold text-ink">{stats && stats.pending_students > 0 ? `${number(stats.pending_students)} mahasiswa belum sinkron pada periode mingguan` : "Mulai dari kelengkapan data"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{stats && stats.pending_students > 0 ? "Periksa status sinkronisasi sebelum menyimpulkan pola aktivitas belajar." : "Buka pemantauan untuk melihat aktivitas terbaru dan ketersediaan data mahasiswa."}</p>
        </div>
        <Link href="/monitoring" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-action px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">Buka pemantauan<ArrowRight className="size-4" aria-hidden="true" /></Link>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <GlassCard className="min-w-0" >
          <SectionHeader title="Waktu layar harian" sub="Rata-rata penggunaan dalam menit, 7 hari terakhir." right={<Clock3 className="size-5 text-primary" aria-hidden="true" />} />
          <div className="px-3 pb-3 sm:px-5" aria-busy={daily.pending}>
            {daily.pending && daily.data && <p role="status" className="text-sm text-muted-foreground">Memperbarui grafik...</p>}
            <DataState pending={daily.pending && !daily.data} error={daily.error} onRetry={daily.reload} empty={!daily.pending && !daily.data?.trends.some(row => row.log_count > 0) && "Grafik tersedia setelah data penggunaan mahasiswa diterima."}>
              <ScreenTimeChart data={(daily.data?.trends ?? []).map(row => ({ label: row.label, value: row.avg_duration_min }))} />
            </DataState>
          </div>
        </GlassCard>
        <GlassCard className="min-w-0">
          <SectionHeader title="Sebaran kelompok" sub="Hasil pengelompokan model, 4 minggu terakhir." right={<ChartColumn className="size-5 text-primary" aria-hidden="true" />} />
          <div className="px-3 pb-3 sm:px-5" aria-busy={weekly.pending}>
            {weekly.pending && weekly.data && <p role="status" className="text-sm text-muted-foreground">Memperbarui grafik...</p>}
            <DataState pending={weekly.pending && !weekly.data} error={weekly.error} onRetry={weekly.reload} empty={!weekly.pending && !weekly.data?.trends.some(row => row.total > 0) && "Belum ada hasil pengelompokan pada periode ini."}>
              <ClusterTrendChart data={weekly.data?.trends ?? []} />
            </DataState>
          </div>
        </GlassCard>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <GlassCard className="min-w-0">
          <SectionHeader title="Ketersediaan lokasi" sub="Log aktivitas saat jadwal kuliah, 7 hari terakhir. Bukan rekap presensi." right={<MapPin className="size-5 text-primary" aria-hidden="true" />} />
          <div className="p-5 pt-0" aria-busy={geofence.pending}>
            <DataState pending={geofence.pending && !location} error={geofence.error} onRetry={geofence.reload} empty={!geofence.pending && location?.total === 0 && "Belum ada log aktivitas pada jadwal kuliah."}>
              {location && <>
                <div className="mb-5 flex items-baseline gap-3"><span className="font-heading text-3xl font-bold">{locationKnown ? `${number(location.inside_rate * 100)}%` : "Belum tersedia"}</span><span className="text-sm text-muted-foreground">{locationKnown ? "log dengan lokasi berada di area kampus" : "Belum ada log dengan lokasi diketahui"}</span></div>
                <dl className="grid gap-3 sm:grid-cols-3">{[{ label: "Di area kampus", count: location.inside, icon: MapPin }, { label: "Di luar area", count: location.outside, icon: MapPin }, { label: "Lokasi belum ada", count: location.unknown, icon: MapPinOff }].map(item => <div key={item.label} className="rounded-xl border border-hairline p-3"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><item.icon className="size-4 shrink-0" aria-hidden="true" />{item.label}</dt><dd className="mt-2 text-xl font-semibold tabular-nums">{number(item.count)} <span className="text-sm font-normal text-muted-foreground">log</span></dd></div>)}</dl>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Persentase tidak mencakup log tanpa lokasi. Lokasi yang belum tersedia dapat memiliki berbagai penyebab.</p>
                {geofence.pending && <p role="status" className="mt-2 text-sm text-muted-foreground">Memperbarui lokasi...</p>}
              </>}
            </DataState>
          </div>
        </GlassCard>
        <section className="dashboard-panel flex flex-col justify-between gap-5 p-6">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><BrainCircuit className="size-6" aria-hidden="true" /></span>
          <div><h2 className="font-heading text-xl font-bold">Pahami data bersama AI</h2><p className="mt-3 text-base leading-relaxed text-muted-foreground">Tanyakan pola penggunaan, sebaran kelompok, atau langkah pendampingan berdasarkan data yang tersedia.</p></div>
          <Link href="/ai" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">Buka AI Analisis<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </section>
      </div>

      <GlassCard>
        <SectionHeader title="Tren jangka panjang" sub="Sebaran hasil pengelompokan, 6 bulan terakhir." />
        <div className="px-3 pb-3 sm:px-5" aria-busy={monthly.pending}>
          {monthly.pending && monthly.data && <p role="status" className="text-sm text-muted-foreground">Memperbarui grafik...</p>}
          <DataState pending={monthly.pending && !monthly.data} error={monthly.error} onRetry={monthly.reload} empty={!monthly.pending && !monthly.data?.trends.some(row => row.total > 0) && "Belum ada hasil pengelompokan bulanan."}><ClusterTrendChart data={monthly.data?.trends ?? []} /></DataState>
        </div>
      </GlassCard>

      <details className="dashboard-panel p-5">
        <summary className="cursor-pointer text-base font-semibold">Rincian sinkronisasi dan model</summary>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div><h2 className="mb-3 flex items-center gap-2 font-semibold"><Activity className="size-5 text-primary" aria-hidden="true" />Aktivitas sesi ini</h2><p className="text-sm leading-relaxed text-muted-foreground">{number(live.logs)} pesan aktivitas dan {number(live.locations)} pesan lokasi diterima sejak halaman dibuka. Pembaruan terakhir: {live.time}.</p>{stats && <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt>Data mahasiswa-hari pada periode mingguan</dt><dd className="font-mono">{number(stats.app_logs_week)}</dd></div><div className="flex justify-between gap-3"><dt>Log data simulasi pada periode mingguan</dt><dd className="font-mono">{number(stats.seed_logs_week)}</dd></div><div className="flex justify-between gap-3"><dt>Rerata log mobile per mahasiswa hari ini</dt><dd className="font-mono">{number(stats.avg_unlock_count_today)}</dd></div></dl>}</div>
          <DataState pending={models.pending && !models.data} error={models.error} onRetry={models.reload}>
            <div><h2 className="mb-3 font-semibold">{activeModel ? `Model aktif v${activeModel.version_number}` : "Belum ada model aktif"}</h2><p className="text-sm leading-relaxed text-muted-foreground">{activeModel ? `${activeModel.kmeans_n_clusters} kelompok dari ${number(activeModel.dataset_size)} data pelatihan. Nomor kelompok tidak menentukan tingkat distraksi.` : "Hasil pengelompokan tersedia setelah model dilatih dan diaktifkan."}</p><Link href="/models" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink">Lihat model analisis<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          </DataState>
        </div>
      </details>
    </div>
  );
}
