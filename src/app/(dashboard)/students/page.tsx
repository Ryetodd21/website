"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  GraduationCap,
  Users,
  ChartColumn,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterChipBar } from "@/components/ui/filter-chip-bar";
import { SortableHeader, useSort } from "@/components/ui/sortable-header";
import { AnimatedMetricValue } from "@/components/ui/animated-metric-value";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard, SectionHeader, MetricCard, PageHeader } from "@/components/metrics";
import { ClusterBadge } from "@/components/metrics/cluster-badge";
import { DownloadButton } from "@/components/ui/download-button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { useApiResource } from "@/hooks/use-api-resource";
import { DataState } from "@/components/ui/data-state";
import { createStudent, getCurrentUser, apiFetch, getModelHistory, getProgramStudi, type ProgramStudi } from "@/lib/api";
import { useInstitution } from "@/lib/institution";
import { useDirtyState } from "@/hooks/use-dirty-state";
import { STUDENTS_PAGE_SIZE, STUDENT_SEARCH_DEBOUNCE_MS } from "@/lib/limits";

interface StudentRow {
  id: string;
  nim: string;
  full_name: string;
  study_program: string;
  semester: number;
  advisor_name: string | null;
  cluster_label: number | null;
  cluster_name: string | null;
  distraction_score: number | null;
  last_log_date: string | null;
}

interface AdvisorOption {
  id: string;
  full_name: string;
}

interface StudentsResponse {
  total: number;
  page: number;
  page_size: number;
  items: StudentRow[];
  cluster_distribution: Record<string, number>;
  active_model_version: number | null;
}

const loadModelLabels = (signal: AbortSignal) => getModelHistory({ signal });

function relativeTime(date: string | null): string {
  if (!date) return "Belum ada";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StudentsPage() {
  // Per Next.js 16: useSearchParams() requires a Suspense boundary, otherwise
  // the static build fails. Split the page so the read happens in an inner
  // component wrapped in Suspense. The surrounding (dashboard)/layout.tsx
  // currently forces this page dynamic (AuthGuard + RoleGate), so the bug is
  // latent — the wrap is preventative against future layout refactors.
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="flex-1 h-24 rounded-sm bg-ink/[0.04] animate-pulse" />
            <div className="flex-1 h-24 rounded-sm bg-ink/[0.04] animate-pulse" />
            <div className="flex-1 h-24 rounded-sm bg-ink/[0.04] animate-pulse" />
            <div className="flex-1 h-24 rounded-sm bg-ink/[0.04] animate-pulse" />
          </div>
          <div className="h-16 rounded-sm bg-ink/[0.04] animate-pulse" />
          <div className="space-y-3 px-5 py-5 bg-ink/[0.03]">
            <div className="flex gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={i === 0 ? "h-8 w-8 rounded-full bg-ink/[0.06] animate-pulse shrink-0" : "flex-1 h-4 rounded-sm bg-ink/[0.06] animate-pulse"} />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="flex gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={i === 0 ? "h-8 w-8 rounded-full bg-ink/[0.06] animate-pulse shrink-0" : "flex-1 h-4 rounded-sm bg-ink/[0.06] animate-pulse"} />
                ))}
              </div>
            ))}
          </div>
        </div>
      }
    >
      <StudentsPageInner />
    </Suspense>
  );
}

function StudentsPageInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const models = useApiResource(loadModelLabels);
  const [clusterFilter, setClusterFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<Awaited<ReturnType<typeof getCurrentUser>>>(null);
  const { profile: institutionProfile } = useInstitution();

  useEffect(() => {
    getCurrentUser().then(u => { if (u) setCurrentUser(u); });
  }, []);

  const [addOpen, setAddOpen] = useState(false);
  const [newNim, setNewNim] = useState("");
  const [newName, setNewName] = useState("");
  const [newSemester, setNewSemester] = useState("1");
  const [newProgram, setNewProgram] = useState("");
  const [newAdvisorId, setNewAdvisorId] = useState("");
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    getProgramStudi({ includeInactive: false, signal: ctrl.signal })
      .then((list) => setProdiList(list))
      .catch(() => {/* non-critical — form still works */});
    return () => ctrl.abort();
  }, []);


  const formFields = { newNim, newName, newSemester, newProgram, newAdvisorId };
  const formBaseline = { newNim: "", newName: "", newSemester: "1", newProgram: "", newAdvisorId: "" };
  const { isDirty, reset: resetFormDirty } = useDirtyState(
    formFields as unknown as Record<string, unknown>,
    formBaseline as unknown as Record<string, unknown>,
  );

  const { key: sortKey, dir: sortDir, toggle: toggleSort, sorted: sortedFn } = useSort<StudentRow>("full_name", "asc");

  const fetchStudents = useCallback((signal: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(STUDENTS_PAGE_SIZE), search: debouncedSearch });
    if (clusterFilter !== "all") params.set("cluster", clusterFilter);
    return apiFetch<StudentsResponse>(`/api/students?${params}`, { signal });
  }, [page, clusterFilter, debouncedSearch]);
  const { data, pending: loading, error, reload: loadStudents } = useApiResource(fetchStudents);
  const sortedItems = useMemo(() => sortedFn(data?.items ?? []), [sortedFn, data?.items]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, STUDENT_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Dosen PA list when the Tambah Mahasiswa dialog opens.
  useEffect(() => {
    if (!addOpen) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await apiFetch<AdvisorOption[]>("/api/users/advisors", { signal: ctrl.signal });
        setAdvisors(res);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setAdvisors([]);
      }
    })();
    return () => ctrl.abort();
  }, [addOpen]);

  const activeModel = models.data?.find(model => model.is_active && model.version_number === data?.active_model_version);
  const labels: Record<string, string> = { ...activeModel?.cluster_labels };
  for (const student of data?.items ?? []) {
    if (student.cluster_label != null && student.cluster_name) labels[String(student.cluster_label)] = student.cluster_name;
  }
  const dist = data?.cluster_distribution ?? {};
  const groups = Array.from(new Set([...Object.keys(dist), ...Object.keys(labels)])).map(id => ({ id, label: labels[id] || `Kelompok ${id}` }));
  const total = data?.total ?? 0;

  const rightActions = (
    <>
      <DownloadButton
        filename="mahasiswa"
        data={data?.items ?? []}
        columns={[
          { key: "nim", label: "NIM" },
          { key: "full_name", label: "Nama Lengkap" },
          { key: "study_program", label: "Program Studi" },
          { key: "semester", label: "Semester" },
          { key: "advisor_name", label: "Dosen PA" },
          { key: "cluster_name", label: "Klaster" },
          { key: "distraction_score", label: "Skor Distraksi", format: (v) => v != null && v !== "" ? Number(v).toFixed(4) : "" },
          { key: "last_log_date", label: "Log Terakhir" },
        ]}
        title="Daftar Mahasiswa"
        label="Unduh"
        institution={{ name: institutionProfile.universityName || "Universitas Negeri Gorontalo", faculty: institutionProfile.faculty, program: institutionProfile.program }}
        downloadedBy={currentUser ? { name: currentUser.full_name ?? currentUser.sub, role: currentUser.role, email: currentUser.email, nip: currentUser.nip } : undefined}
      />
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger render={
          <Button size="sm" className="h-8 gap-1.5 text-xs rounded-none shadow-sm shadow-primary/10">
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </Button>
        } />
        <DialogContent>
          <DialogHeader>
            {isDirty && (
              <div className="border border-warning/40 bg-warning/[0.04] px-3 py-2 -mx-1 animate-fade-up">
                <p className="text-xs text-ink flex items-center justify-between gap-2">
                  <span><span className="font-semibold">Perubahan belum disimpan.</span> Tutup akan membuang data.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewNim("");
                      setNewName("");
                      setNewSemester("1");
                      setNewProgram("");
                      setNewAdvisorId("");
                      resetFormDirty();
                    }}
                    className="editorial-ghost text-[11px] shrink-0"
                  >
                    Reset
                  </button>
                </p>
              </div>
            )}
            <DialogTitle>Tambah Mahasiswa</DialogTitle>
            <DialogDescription>
              Daftarkan mahasiswa baru ke sistem monitoring
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>NIM</Label>
                <Input placeholder="411423XXX" value={newNim} onChange={(e) => setNewNim(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={newSemester} onValueChange={(v) => v && setNewSemester(v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Nama mahasiswa" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Program Studi</Label>
              <Select value={newProgram} onValueChange={(v) => v && setNewProgram(v)}>
                <SelectTrigger><SelectValue placeholder="Pilih prodi" /></SelectTrigger>
                <SelectContent>
                  {prodiList.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dosen PA</Label>
              <Select value={newAdvisorId} onValueChange={(v) => setNewAdvisorId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Pilih dosen PA (opsional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {advisors.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name || a.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button disabled={saving} onClick={async () => {
              if (!newNim.trim() || !newName.trim()) {
                toast.error("NIM dan Nama harus diisi");
                return;
              }
              setSaving(true);
              try {
                await createStudent({
                  nim: newNim.trim(),
                  full_name: newName.trim(),
                  program_studi: newProgram,
                  semester: parseInt(newSemester, 10),
                  advisor_id: newAdvisorId || null,
                });
                toast.success("Mahasiswa berhasil ditambahkan");
                setAddOpen(false);
                setNewNim("");
                setNewName("");
                setNewSemester("1");
                setNewProgram("");
                setNewAdvisorId("");
                loadStudents();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menambah mahasiswa");
              } finally {
                setSaving(false);
              }
            }}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <div className="space-y-5 py-4">
      <PageHeader
        title="Data Mahasiswa"
        subtitle={data ? `${total} mahasiswa sesuai pencarian${data.active_model_version != null ? ` · Model v${data.active_model_version}` : " · Belum ada model aktif"}` : "Kelola data mahasiswa dan tinjau hasil pengelompokan."}
        showDate={false}
        rightActions={rightActions}
      />

      <DataState error={error} onRetry={loadStudents}>
      {/* ─── Metric Cards ─── */}
      <section className="border-t border-hairline">
        <div className="grid gap-px grid-cols-2 lg:grid-cols-4 w-full max-w-full bg-hairline">
          <MetricCard
            icon={Users}
            label="Mahasiswa sesuai pencarian"
            value={data ? <AnimatedMetricValue value={total} /> : null}
            pending={loading}
            sub="Jumlah sesuai filter aktif"
            number="01"
            delay={0}
          />
          {groups.map(group => <MetricCard key={group.id} icon={ChartColumn} label={group.label} value={dist[group.id] ?? 0} sub="Data pelatihan model aktif, bukan jumlah mahasiswa unik" pending={loading} />)}
        </div>
      </section>

      {/* ─── Filters ─── */}
      <GlassCard>
        <SectionHeader
          title="Daftar Mahasiswa"
          sub={`${data?.items.length ?? 0} dari ${total} mahasiswa${data?.active_model_version ? ` · Hasil clustering v${data.active_model_version}` : ""}`}
          right={
            <span className="eyebrow-sm text-ink/55">
              Halaman {page}
            </span>
          }
        />
        <div className="px-4 pb-5 sm:px-5">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/55" />
              <Input
                aria-label="Cari mahasiswa berdasarkan nama atau NIM"
                placeholder="Cari nama atau NIM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <FilterChipBar
              label="Klaster"
              chips={groups}
              active={clusterFilter !== "all" ? [clusterFilter] : []}
              onToggle={(id) => { setClusterFilter(current => current === id ? "all" : id); setPage(1); }}
              onClear={() => { setClusterFilter("all"); setPage(1); }}
            />
          </div>

          {models.error && <div className="mb-4 text-sm text-muted-foreground"><p>Nama kelompok belum dapat dimuat. Nomor kelompok tetap ditampilkan.</p><Button variant="ghost" onClick={models.reload}>Muat ulang nama kelompok</Button></div>}
          {loading ? (
            <div className="border-t border-hairline p-6">
              <SkeletonTable rows={8} cols={7} />
            </div>
          ) : data?.items.length === 0 ? (
            <EmptyState illustration="students" title="Belum ada mahasiswa untuk ditampilkan" description="Coba ubah pencarian, hapus filter, atau tambahkan mahasiswa." action={page > 1 ? <Button variant="outline" onClick={() => setPage(1)}>Kembali ke halaman pertama</Button> : undefined} />
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortableHeader label="Mahasiswa" sortKey="full_name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      </TableHead>
                      <TableHead>Prodi</TableHead>
                      <TableHead className="text-center">
                        <SortableHeader label="Smstr" sortKey="semester" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                      </TableHead>
                      <TableHead>Dosen PA</TableHead>
                      <TableHead>Klaster</TableHead>
                      <TableHead className="text-right">
                        <SortableHeader label="Skor" sortKey="distraction_score" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                      </TableHead>
                      <TableHead>
                        <SortableHeader label="Log Terakhir" sortKey="last_log_date" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                      sortedItems.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-ink text-xs font-bold">
                                {s.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{s.full_name}</p>
                                <p className="text-xs text-ink/55 font-mono">{s.nim}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{s.study_program}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono text-sm text-ink">{s.semester}</span>
                          </TableCell>
                          <TableCell className="text-sm text-ink/55">
                            {s.advisor_name ?? "kosong"}
                          </TableCell>
                          <TableCell>
                            <ClusterBadge cluster={s.cluster_name} />
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {s.distraction_score != null ? s.distraction_score.toFixed(2) : "kosong"}
                          </TableCell>
                          <TableCell className="text-xs text-ink/55">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="h-3 w-3" />
                              {relativeTime(s.last_log_date)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-ink/55">
                  Halaman {page} dari {Math.max(1, Math.ceil(total / STUDENTS_PAGE_SIZE))}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-8 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * STUDENTS_PAGE_SIZE >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 text-xs"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </GlassCard>
      </DataState>
    </div>
  );
}
