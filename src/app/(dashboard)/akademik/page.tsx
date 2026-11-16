"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  KeyRound,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard, SectionHeader, StatusBadge } from "@/components/metrics";
import { PageHeader } from "@/components/metrics/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createFakultas,
  createJurusan,
  createMataKuliah,
  createJadwalMataKuliah,
  createProgramStudi,
  deleteFakultas,
  deleteJurusan,
  deleteJadwalMataKuliah,
  deleteMataKuliah,
  deleteProgramStudi,
  deleteRequestAkademik,
  getFakultas,
  getJadwalMataKuliah,
  getJurusan,
  getMataKuliah,
  getProgramStudi,
  getCampuses,
  getRequestAkademik,
  reviewRequestAkademik,
  updateFakultas,
  updateJadwalMataKuliah,
  updateJurusan,
  updateMataKuliah,
  updateProgramStudi,
  type Fakultas,
  type Campus,
  type JadwalMataKuliah,
  type JadwalMataKuliahInput,
  type Jurusan,
  type MataKuliah,
  type MataKuliahInput,
  type ProgramStudi,
  type RequestAkademik,
  type RequestAkademikStatus,
  type RequestAkademikType,
} from "@/lib/api";
import { t as L } from "@/lib/i18n";

// Hari dalam seminggu untuk jadwal. Senin=1, Minggu=7 (ISO).
const DAYS_ID: { value: number; label: string }[] = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

function dayLabel(d: number): string {
  return DAYS_ID.find((x) => x.value === d)?.label ?? `Hari ${d}`;
}

interface EditableMataKuliah {
  id?: string;
  code: string;
  name: string;
  sks: number;
  semester: number;
  program_studi_id: string | null;
  // Required — backend MataKuliahCreate.campus_id wajib diisi.
  campus_id: string;
  description: string;
}

const EMPTY_MATAKULIAH: EditableMataKuliah = {
  code: "",
  name: "",
  sks: 3,
  semester: 1,
  program_studi_id: null,
  campus_id: "",
  description: "",
};

interface EditableJadwal {
  id?: string;
  mata_kuliah_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
}

const EMPTY_JADWAL: EditableJadwal = {
  mata_kuliah_id: "",
  day_of_week: 1,
  start_time: "08:00",
  end_time: "09:40",
  room: "",
};

const REQUEST_STATUS_LABEL: Record<RequestAkademikStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const REQUEST_STATUS_TONE: Record<RequestAkademikStatus, "warning" | "completed" | "failed"> = {
  pending: "warning",
  approved: "completed",
  rejected: "failed",
};

function requestTypeLabel(t: RequestAkademikType): string {
  return t === "course" ? "Mata Kuliah" : "Slot Jadwal";
}

export default function AkademikPage() {
  const [mataKuliah, setMataKuliah] = useState<MataKuliah[]>([]);
  const [jadwal, setJadwal] = useState<JadwalMataKuliah[]>([]);
  const [requests, setRequests] = useState<RequestAkademik[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [fakultasList, setFakultasList] = useState<Fakultas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProdiMk, setFilterProdiMk] = useState<string>("all");
  const [filterProdiJdw, setFilterProdiJdw] = useState<string>("all");

  const [mkDialog, setMkDialog] = useState<{ open: boolean; editing: EditableMataKuliah | null }>({
    open: false,
    editing: null,
  });
  const [jdwDialog, setJdwDialog] = useState<{ open: boolean; editing: EditableJadwal | null }>({
    open: false,
    editing: null,
  });
  const [savingMk, setSavingMk] = useState(false);
  const [savingJdw, setSavingJdw] = useState(false);

  const [fkDialog, setFkDialog] = useState<{ open: boolean; editing: Fakultas | null }>({
    open: false,
    editing: null,
  });
  const [jrDialog, setJrDialog] = useState<{ open: boolean; editing: Jurusan | null }>({
    open: false,
    editing: null,
  });
  const [pdDialog, setPdDialog] = useState<{ open: boolean; editing: ProgramStudi | null }>({
    open: false,
    editing: null,
  });
  const [savingFk, setSavingFk] = useState(false);
  const [savingJr, setSavingJr] = useState(false);
  const [savingPd, setSavingPd] = useState(false);

  // collapsedJurusan: Set of Jurusan IDs whose prodi subtree is currently
  // hidden. Default empty (all expanded) so the page never loads in a
  // surprising "everything collapsed" state. Operators can collapse/expand
  // per Jurusan via the chevron button on each Jurusan header.
  const [collapsedJurusan, setCollapsedJurusan] = useState<Set<string>>(new Set());
  const toggleJurusanCollapse = (id: string) => {
    setCollapsedJurusan((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function refreshAll(signal?: AbortSignal) {
    setLoading(true);
    try {
      const [mk, jdw, req, prodi, fk, jr, campuses] = await Promise.all([
        getMataKuliah({ include_inactive: true }, signal),
        getJadwalMataKuliah({ include_inactive: true }, signal),
        getRequestAkademik({}, signal),
        getProgramStudi({ signal }).catch(() => []),
        getFakultas(true, signal).catch(() => []),
        getJurusan({ includeInactive: true, signal }).catch(() => []),
        getCampuses().catch(() => []),
      ]);
      setMataKuliah(mk);
      setJadwal(jdw);
      setRequests(req);
      setProdiList(prodi);
      setFakultasList(fk);
      setJurusanList(jr);
      setCampusList(campuses);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error(`Gagal memuat data akademik: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  // ─── Fakultas CRUD ────────────────────────────────────────────
  function openFkNew() {
    setFkDialog({ open: true, editing: { id: "", code: "", name: "", description: "", campus_id: null, is_active: true } as Fakultas });
  }
  function openFkEdit(f: Fakultas) {
    setFkDialog({ open: true, editing: f });
  }
  async function saveFk() {
    const e = fkDialog.editing;
    if (!e) return;
    if (!e.code.trim() || !e.name.trim()) {
      toast.error("Code dan nama fakultas wajib diisi");
      return;
    }
    setSavingFk(true);
    try {
      const payload = {
        code: e.code.trim().toUpperCase(),
        name: e.name.trim(),
        description: e.description ?? "",
        campus_id: e.campus_id ?? null,
      };
      if (e.id) {
        const updated = await updateFakultas(e.id, { ...payload, is_active: e.is_active });
        setFakultasList((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        toast.success("Fakultas diperbarui");
      } else {
        const created = await createFakultas(payload);
        setFakultasList((prev) => [...prev, created]);
        toast.success("Fakultas ditambahkan");
      }
      setFkDialog({ open: false, editing: null });
    } catch (err) {
      toast.error(`Gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingFk(false);
    }
  }
  async function removeFk(f: Fakultas) {
    if (!confirm(`Hapus fakultas "${f.name}"? Jurusan dan program studi di dalamnya akan ikut terhapus.`)) return;
    try {
      await deleteFakultas(f.id);
      setFakultasList((prev) => prev.filter((x) => x.id !== f.id));
      const orphanedJrIds = new Set(jurusanList.filter((j) => j.fakultas_id === f.id).map((j) => j.id));
      setJurusanList((prev) => prev.filter((j) => j.fakultas_id !== f.id));
      setProdiList((prev) => prev.filter((p) => !(p.jurusan_id && orphanedJrIds.has(p.jurusan_id))));
      toast.success("Fakultas dihapus");
    } catch (err) {
      toast.error(`Gagal: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ─── Jurusan CRUD ─────────────────────────────────────────────
  function openJrEdit(j: Jurusan) {
    setJrDialog({ open: true, editing: j });
  }
  async function saveJr() {
    const e = jrDialog.editing;
    if (!e) return;
    if (!e.code.trim() || !e.name.trim()) {
      toast.error("Code dan nama jurusan wajib diisi");
      return;
    }
    if (!e.fakultas_id) {
      toast.error("Pilih fakultas terlebih dahulu");
      return;
    }
    setSavingJr(true);
    try {
      const payload = {
        code: e.code.trim().toUpperCase(),
        name: e.name.trim(),
        description: e.description ?? "",
        fakultas_id: e.fakultas_id,
      };
      if (e.id) {
        const updated = await updateJurusan(e.id, { ...payload, is_active: e.is_active });
        setJurusanList((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        toast.success("Jurusan diperbarui");
      } else {
        const created = await createJurusan(payload);
        setJurusanList((prev) => [...prev, created]);
        toast.success("Jurusan ditambahkan");
      }
      setJrDialog({ open: false, editing: null });
    } catch (err) {
      toast.error(`Gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingJr(false);
    }
  }
  async function removeJr(j: Jurusan) {
    if (!confirm(`Hapus jurusan "${j.name}"? Program studi di dalamnya akan kehilangan induk.`)) return;
    try {
      await deleteJurusan(j.id);
      setJurusanList((prev) => prev.filter((x) => x.id !== j.id));
      setProdiList((prev) => prev.map((p) => (p.jurusan_id === j.id ? { ...p, jurusan_id: null } : p)));
      toast.success("Jurusan dihapus");
    } catch (err) {
      toast.error(`Gagal: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ─── Program Studi CRUD (with parent jurusan) ─────────────────
  function openPdEdit(p: ProgramStudi) {
    setPdDialog({ open: true, editing: p });
  }
  async function savePd() {
    const e = pdDialog.editing;
    if (!e) return;
    if (!e.code.trim() || !e.name.trim()) {
      toast.error("Code dan nama program studi wajib diisi");
      return;
    }
    setSavingPd(true);
    try {
      const payload = {
        code: e.code.trim().toUpperCase(),
        name: e.name.trim(),
        description: e.description ?? "",
        jurusan_id: (e as ProgramStudi & { jurusan_id?: string | null }).jurusan_id || null,
      };
      if (e.id) {
        const updated = await updateProgramStudi(e.id, { ...payload, is_active: e.is_active });
        setProdiList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("Program studi diperbarui");
      } else {
        const created = await createProgramStudi(payload);
        setProdiList((prev) => [...prev, created]);
        toast.success("Program studi ditambahkan");
      }
      setPdDialog({ open: false, editing: null });
    } catch (err) {
      toast.error(`Gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingPd(false);
    }
  }
  async function removePd(p: ProgramStudi) {
    if (!confirm(`Hapus program studi "${p.name}"?`)) return;
    try {
      await deleteProgramStudi(p.id);
      setProdiList((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Program studi dihapus");
    } catch (err) {
      toast.error(`Gagal menghapus: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshAll(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  function prodiName(id: string | null | undefined): string {
    if (!id) return "";
    return prodiList.find((p) => p.id === id)?.name ?? "";
  }

  function mkName(id: string | null | undefined): string {
    if (!id) return "";
    return mataKuliah.find((m) => m.id === id)?.name ?? "(tidak diketahui)";
  }

  function openMkNew() {
    setMkDialog({ open: true, editing: { ...EMPTY_MATAKULIAH } });
  }
  function openMkEdit(m: MataKuliah) {
    setMkDialog({
      open: true,
      editing: {
        id: m.id,
        code: m.code,
        name: m.name,
        sks: m.sks,
        semester: m.semester,
        program_studi_id: m.program_studi_id,
        campus_id: m.campus_id ?? "",
        description: m.description ?? "",
      },
    });
  }
  function closeMk() {
    setMkDialog({ open: false, editing: null });
  }
  async function saveMk() {
    const e = mkDialog.editing;
    if (!e) return;
    if (!e.code.trim() || !e.name.trim()) {
      toast.error("Kode dan nama mata kuliah wajib diisi");
      return;
    }
    if (!e.campus_id.trim()) {
      toast.error("Pilih lokasi kampus untuk mata kuliah");
      return;
    }
    if (!e.program_studi_id) {
      toast.error("Pilih program studi untuk mata kuliah");
      return;
    }
    setSavingMk(true);
    const payload: MataKuliahInput = {
      code: e.code.trim().toUpperCase(),
      name: e.name.trim(),
      sks: Number(e.sks) || 0,
      semester: Number(e.semester) || 1,
      program_studi_id: e.program_studi_id,
      campus_id: e.campus_id.trim(),
      description: e.description.trim(),
    };
    try {
      if (e.id) {
        const updated = await updateMataKuliah(e.id, payload);
        setMataKuliah((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        toast.success("Mata kuliah diperbarui");
      } else {
        const created = await createMataKuliah(payload);
        setMataKuliah((prev) => [...prev, created]);
        toast.success("Mata kuliah ditambahkan");
      }
      closeMk();
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingMk(false);
    }
  }
  async function removeMk(m: MataKuliah) {
    if (!confirm(`Hapus mata kuliah ${m.code} - ${m.name}? Jadwal terkait akan ikut terhapus.`)) {
      return;
    }
    try {
      await deleteMataKuliah(m.id);
      setMataKuliah((prev) => prev.filter((x) => x.id !== m.id));
      toast.success("Mata kuliah dihapus");
    } catch (err) {
      toast.error(`Gagal menghapus: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async function toggleMkActive(m: MataKuliah) {
    try {
      const updated = await updateMataKuliah(m.id, { is_active: !m.is_active });
      setMataKuliah((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (err) {
      toast.error(`Gagal mengubah status: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function openJdwNew() {
    if (mataKuliah.length === 0) {
      toast.error("Tambahkan mata kuliah dulu sebelum membuat jadwal");
      return;
    }
    setJdwDialog({
      open: true,
      editing: { ...EMPTY_JADWAL, mata_kuliah_id: mataKuliah[0]?.id ?? "" },
    });
  }
  function openJdwEdit(j: JadwalMataKuliah) {
    setJdwDialog({
      open: true,
      editing: {
        id: j.id,
        mata_kuliah_id: j.mata_kuliah_id,
        day_of_week: j.day_of_week,
        start_time: j.start_time?.slice(0, 5) ?? "08:00",
        end_time: j.end_time?.slice(0, 5) ?? "09:40",
        room: j.room ?? "",
      },
    });
  }
  function closeJdw() {
    setJdwDialog({ open: false, editing: null });
  }
  function isJdwValid(): boolean {
    const e = jdwDialog.editing;
    if (!e) return false;
    if (!e.mata_kuliah_id) return false;
    if (!e.start_time || !e.end_time) return false;
    if (e.start_time >= e.end_time) return false;
    return true;
  }
  async function saveJdw() {
    const e = jdwDialog.editing;
    if (!e) return;
    if (!e.mata_kuliah_id) {
      toast.error("Pilih mata kuliah terlebih dahulu");
      return;
    }
    if (!e.start_time || !e.end_time) {
      toast.error("Jam mulai dan selesai wajib diisi");
      return;
    }
    if (e.start_time >= e.end_time) {
      toast.error("Jam mulai harus sebelum jam selesai");
      return;
    }
    setSavingJdw(true);
    const payload: JadwalMataKuliahInput = {
      mata_kuliah_id: e.mata_kuliah_id,
      day_of_week: Number(e.day_of_week),
      start_time: e.start_time,
      end_time: e.end_time,
      room: e.room.trim(),
    };
    try {
      if (e.id) {
        const updated = await updateJadwalMataKuliah(e.id, payload);
        setJadwal((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        toast.success("Jadwal diperbarui");
      } else {
        const created = await createJadwalMataKuliah(payload);
        setJadwal((prev) => [...prev, created]);
        toast.success("Jadwal ditambahkan");
      }
      closeJdw();
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingJdw(false);
    }
  }
  async function removeJdw(j: JadwalMataKuliah) {
    if (!confirm("Sembunyikan jadwal ini?")) return;
    try {
      await deleteJadwalMataKuliah(j.id);
      setJadwal((prev) => prev.map((x) => (x.id === j.id ? { ...x, is_active: false } : x)));
      toast.success("Jadwal dihapus");
    } catch (err) {
      toast.error(`Gagal menghapus: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async function toggleJdwActive(j: JadwalMataKuliah) {
    try {
      const updated = await updateJadwalMataKuliah(j.id, { is_active: !j.is_active });
      setJadwal((prev) => prev.map((x) => (x.id === j.id ? updated : x)));
      toast.success(j.is_active ? "Jadwal dinonaktifkan" : "Jadwal diaktifkan");
    } catch (err) {
      toast.error(`Gagal mengubah status: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function review(req: RequestAkademik, status: "approved" | "rejected") {
    const notes = prompt(
      status === "approved"
        ? "Catatan persetujuan (opsional):"
        : "Alasan penolakan:",
      ""
    );
    if (status === "rejected" && notes === null) return;
    if (notes === null) return;
    try {
      const updated = await reviewRequestAkademik(req.id, status, notes ?? "");
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(status === "approved" ? "Permintaan disetujui" : "Permintaan ditolak");
    } catch (err) {
      toast.error(`Gagal memperbarui: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async function removeReq(req: RequestAkademik) {
    if (!confirm("Hapus permintaan ini dari antrian?")) return;
    try {
      await deleteRequestAkademik(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success("Permintaan dihapus");
    } catch (err) {
      toast.error(`Gagal menghapus: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const prodiOptions = prodiList.filter((p) => p.is_active);
  const campusOptions = campusList.filter((c) => c.is_active);

  const jurusansByFakultas = (fkId: string) => jurusanList.filter((j) => j.fakultas_id === fkId);
  const prodisByJurusan = (jrId: string | null) => prodiList.filter((p) => p.jurusan_id === jrId);

  const filteredMataKuliah = useMemo(() => {
    if (filterProdiMk === "all") return mataKuliah;
    return mataKuliah.filter((m) => m.program_studi_id === filterProdiMk);
  }, [mataKuliah, filterProdiMk]);

  const filteredJadwal = useMemo(() => {
    if (filterProdiJdw === "all") return jadwal;
    const mkMap = new Map(mataKuliah.map((m) => [m.id, m]));
    return jadwal.filter((j) => mkMap.get(j.mata_kuliah_id)?.program_studi_id === filterProdiJdw);
  }, [jadwal, mataKuliah, filterProdiJdw]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={L.akademik.title}
        subtitle={L.akademik.subtitle}
        number="04"
      />

      {/* Struktur Akademik — Fakultas → Jurusan → Program Studi */}
      <GlassCard>
        <SectionHeader
          number="01"
          title={L.akademik.sectionAkademikTitle}
          sub={L.akademik.sectionAkademikSub}
          right={
            <div className="flex items-center gap-2">
              <button type="button" className="editorial-cta" onClick={openFkNew}>
                <Save className="h-3.5 w-3.5" />
                {L.dialog.tambahFakultas}
              </button>
            </div>
          }
        />
        <div className="border-t border-hairline">
          {loading ? (
            <div className="px-5 py-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-5/6" />
              <Skeleton className="h-10 w-4/6" />
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {fakultasList.length === 0 && (
                <div className="py-6">
                  <EmptyState
                    illustration="inbox"
                    size="sm"
                    title="Belum ada fakultas"
                    description="Klik Tambah Fakultas untuk membuat struktur akademik pertama."
                  />
                </div>
              )}
              {fakultasList.map((fk) => {
                const jrs = jurusansByFakultas(fk.id);
                return (
                  <div key={fk.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="eyebrow-sm text-ink/45">Fakultas</span>
                          <span className="font-mono text-[11px] text-ink/55">{fk.code}</span>
                          {!fk.is_active && (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-ink/45">
                              non-aktif
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-ink mt-1">{fk.name}</div>
                        {fk.description && (
                          <div className="text-[11px] text-ink/55 mt-0.5">{fk.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => openFkEdit(fk)} className="editorial-ghost text-[11px]">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeFk(fk)}
                          className="editorial-ghost text-[11px] text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 ml-3 pl-4 border-l border-hairline space-y-3">
                      {jrs.length === 0 && (
                        <div className="text-[11px] text-ink/45 italic">
                          Belum ada jurusan. Klik &ldquo;Tambah Jurusan&rdquo; untuk membuat.
                        </div>
                      )}
                      {jrs.map((j) => {
                        const ps = prodisByJurusan(j.id);
                        const isCollapsed = collapsedJurusan.has(j.id);
                        const CollapseIcon = isCollapsed ? ChevronRight : ChevronDown;
                        return (
                          <div key={j.id}>
                            <div className="flex items-start justify-between gap-4">
                              <button
                                type="button"
                                onClick={() => toggleJurusanCollapse(j.id)}
                                className="flex items-center gap-2 text-left min-w-0 group/jr"
                                aria-expanded={!isCollapsed}
                                aria-label={isCollapsed ? `Buka ${j.name}` : `Lipat ${j.name}`}
                              >
                                <CollapseIcon
                                  className="h-3.5 w-3.5 text-ink/55 group-hover/jr:text-ink shrink-0 transition-colors"
                                  strokeWidth={2.5}
                                />
                                <span className="min-w-0">
                                  <span className="flex items-center gap-2">
                                    <span className="eyebrow-sm text-ink/45">Jurusan</span>
                                    <span className="font-mono text-[11px] text-ink/55">{j.code}</span>
                                    {!j.is_active && (
                                      <span className="text-[10px] uppercase tracking-[0.18em] text-ink/45">
                                        non-aktif
                                      </span>
                                    )}
                                  </span>
                                  <span className="block text-sm text-ink mt-0.5">{j.name}</span>
                                </span>
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="eyebrow-sm text-ink/40 tabular-nums mr-1">
                                  {ps.length} prodi
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openJrEdit(j)}
                                  className="editorial-ghost text-[11px]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void removeJr(j)}
                                  className="editorial-ghost text-[11px] text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="mt-2 ml-3 pl-4 border-l border-hairline space-y-1.5">
                                {ps.length === 0 && (
                                  <div className="text-[11px] text-ink/45 italic">
                                    Belum ada program studi.
                                  </div>
                                )}
                                {ps.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between gap-3 py-1"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="eyebrow-sm text-ink/45">Prodi</span>
                                      <span className="font-mono text-[11px] text-ink/55 shrink-0">
                                        {p.code}
                                      </span>
                                      <span className="text-sm text-ink truncate">{p.name}</span>
                                      {!p.is_active && (
                                        <span className="text-[10px] uppercase tracking-[0.18em] text-ink/45 shrink-0">
                                          non-aktif
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => openPdEdit(p)}
                                        className="editorial-ghost text-[11px]"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void removePd(p)}
                                        className="editorial-ghost text-[11px] text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPdDialog({
                                      open: true,
                                      editing: {
                                        id: "",
                                        code: "",
                                        name: "",
                                        description: "",
                                        is_active: true,
                                        jurusan_id: j.id,
                                      } as ProgramStudi,
                                    });
                                  }}
                                  className="editorial-ghost text-[11px]"
                                >
                                  {L.label.tambahProdi}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setJrDialog({
                            open: true,
                            editing: {
                              id: "",
                              code: "",
                              name: "",
                              description: "",
                              fakultas_id: fk.id,
                              is_active: true,
                            } as Jurusan,
                          });
                        }}
                        className="editorial-ghost text-[11px]"
                      >
                        {L.label.tambahJurusan}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Mata Kuliah */}
      <GlassCard>
        <SectionHeader
          number="02"
          title={L.akademik.sectionMataKuliahTitle}
          sub={L.akademik.sectionMataKuliahSub}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter prodi mata kuliah"
                className="editorial-input h-8 text-xs py-1 px-2.5 bg-paper"
                value={filterProdiMk}
                onChange={(e) => setFilterProdiMk(e.target.value)}
              >
                <option value="all">Semua Prodi ({mataKuliah.length})</option>
                {prodiList.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                ))}
              </select>
              <button type="button" className="editorial-cta" onClick={openMkNew}>
                <Save className="h-3.5 w-3.5" />
                {L.dialog.tambahMataKuliah}
              </button>
            </div>
          }
        />
        <div className="border-t border-hairline">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-ink/55">Memuat data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="eyebrow-sm">{L.label.kode}</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.nama}</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.sks}</TableHead>
                  <TableHead className="eyebrow-sm">Smt</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.programStudi}</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.aktif}</TableHead>
                  <TableHead className="eyebrow-sm text-right">{L.label.aksi}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMataKuliah.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-[11px]">{m.code}</TableCell>
                    <TableCell>
                      <div className="text-sm text-ink">{m.name}</div>
                      {m.description && (
                        <div className="text-[10px] text-ink/55 mt-0.5">{m.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{m.sks}</TableCell>
                    <TableCell className="font-mono text-sm">{m.semester}</TableCell>
                    <TableCell className="text-sm">{prodiName(m.program_studi_id) || "kosong"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={() => void toggleMkActive(m)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openMkEdit(m)} className="editorial-ghost text-[11px]">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeMk(m)}
                          className="editorial-ghost text-[11px] text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMataKuliah.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-sm text-ink/55">
                      {filterProdiMk === "all" ? "Belum ada mata kuliah." : "Tidak ada mata kuliah untuk program studi ini."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </GlassCard>

      {/* Jadwal Mata Kuliah */}
      <GlassCard>
        <SectionHeader
          number="03"
          title={L.akademik.sectionJadwalTitle}
          sub={L.akademik.sectionJadwalSub}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter prodi jadwal mata kuliah"
                className="editorial-input h-8 text-xs py-1 px-2.5 bg-paper"
                value={filterProdiJdw}
                onChange={(e) => setFilterProdiJdw(e.target.value)}
              >
                <option value="all">Semua Prodi ({jadwal.length})</option>
                {prodiList.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                ))}
              </select>
              <button type="button" className="editorial-cta" onClick={openJdwNew}>
                <CalendarDays className="h-3.5 w-3.5" />
                {L.dialog.tambahJadwal}
              </button>
            </div>
          }
        />
        <div className="border-t border-hairline">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-ink/55">Memuat data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="eyebrow-sm">{L.label.mataKuliah}</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.hari}</TableHead>
                  <TableHead className="eyebrow-sm">Jam</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.ruang}</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.aktif}</TableHead>
                  <TableHead className="eyebrow-sm text-right">{L.label.aksi}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJadwal.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-sm">{mkName(j.mata_kuliah_id)}</TableCell>
                    <TableCell className="text-sm">{dayLabel(j.day_of_week)}</TableCell>
                    <TableCell className="font-mono text-[11px]">
                      {j.start_time?.slice(0, 5)} – {j.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell className="text-sm">{j.room || "kosong"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={j.is_active}
                        onCheckedChange={() => void toggleJdwActive(j)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openJdwEdit(j)} className="editorial-ghost text-[11px]">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeJdw(j)}
                          className="editorial-ghost text-[11px] text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredJadwal.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-sm text-ink/55">
                      {filterProdiJdw === "all" ? "Belum ada jadwal." : "Tidak ada jadwal untuk program studi ini."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </GlassCard>

      {/* Antrian Permintaan Akademik */}
      <GlassCard>
        <SectionHeader
          number="04"
          title={L.akademik.sectionAntrianTitle}
          sub={L.akademik.sectionAntrianSub}
          right={
            <StatusBadge
              type={pendingCount > 0 ? "warning" : "completed"}
              label={pendingCount > 0 ? `${pendingCount} menunggu` : "Tidak ada antrian"}
            />
          }
        />
        <div className="border-t border-hairline">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-ink/55">Memuat antrian...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="eyebrow-sm">Tipe</TableHead>
                  <TableHead className="eyebrow-sm">{L.label.nama}</TableHead>
                  <TableHead className="eyebrow-sm">Status</TableHead>
                  <TableHead className="eyebrow-sm text-right">{L.label.aksi}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        {r.type === "course" ? (
                          <GraduationCap className="h-3.5 w-3.5 text-ink/55" />
                        ) : (
                          <ClipboardList className="h-3.5 w-3.5 text-ink/55" />
                        )}
                        {requestTypeLabel(r.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-ink">{r.name}</div>
                      {r.description && (
                        <div className="text-[10px] text-ink/55 mt-0.5">{r.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type={REQUEST_STATUS_TONE[r.status]} label={REQUEST_STATUS_LABEL[r.status]} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {r.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => void review(r, "approved")}
                              className="editorial-ghost text-[11px] text-success"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => void review(r, "rejected")}
                              className="editorial-ghost text-[11px] text-destructive"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => void removeReq(r)}
                          className="editorial-ghost text-[11px] text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-sm text-ink/55">
                      Antrian kosong.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </GlassCard>

      {/* Note explaining the page (editorial) */}
      <div className="border-t border-hairline bg-paper p-5 sm:p-6 flex items-start gap-3">
        <KeyRound className="h-4 w-4 text-ink/55 mt-0.5 shrink-0" />
        <p className="text-xs text-ink/65 leading-relaxed">
          {L.akademik.noteText}
        </p>
      </div>

      {/* Dialog — Mata Kuliah */}
      <Dialog
        open={mkDialog.open}
        onOpenChange={(o) => {
          if (!o) closeMk();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {mkDialog.editing?.id ? L.dialog.editMataKuliah : L.dialog.tambahMataKuliah}
            </DialogTitle>
            <DialogDescription>
              Isi kode, nama, SKS, semester, dan lokasi kampus (wajib).
            </DialogDescription>
          </DialogHeader>
          {mkDialog.editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block mb-1">{L.label.kode}</label>
                  <input
                    className="editorial-input w-full uppercase"
                    maxLength={20}
                    value={mkDialog.editing.code}
                    onChange={(e) =>
                      setMkDialog({
                        open: true,
                        editing: { ...mkDialog.editing!, code: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="IF101"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">{L.label.nama}</label>
                  <input
                    className="editorial-input w-full"
                    maxLength={100}
                    value={mkDialog.editing.name}
                    onChange={(e) =>
                      setMkDialog({
                        open: true,
                        editing: { ...mkDialog.editing!, name: e.target.value },
                      })
                    }
                    placeholder="Algoritma dan Struktur Data"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block mb-1">{L.label.sks}</label>
                  <input
                    className="editorial-input w-full"
                    type="number"
                    min={0}
                    max={24}
                    value={mkDialog.editing.sks}
                    onChange={(e) =>
                      setMkDialog({
                        open: true,
                        editing: { ...mkDialog.editing!, sks: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">{L.label.semester}</label>
                  <input
                    className="editorial-input w-full"
                    type="number"
                    min={1}
                    max={14}
                    value={mkDialog.editing.semester}
                    onChange={(e) =>
                      setMkDialog({
                        open: true,
                        editing: { ...mkDialog.editing!, semester: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow block mb-1">{L.label.lokasiKampus} <span className="text-destructive">*</span></label>
                <select
                  className="editorial-input w-full"
                  value={mkDialog.editing.campus_id}
                  onChange={(e) =>
                    setMkDialog({
                      open: true,
                      editing: { ...mkDialog.editing!, campus_id: e.target.value },
                    })
                  }
                >
                  <option value="">Pilih lokasi kampus</option>
                  {campusOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-ink/45 mt-1">
                  Wajib. Android pakai lokasi ini untuk deteksi kehadiran mahasiswa saat jam kuliah.
                </p>
              </div>
              <div>
                <label className="eyebrow block mb-1">{L.label.programStudi} <span className="text-destructive">*</span></label>
                <select
                  className="editorial-input w-full"
                  value={mkDialog.editing.program_studi_id ?? ""}
                  onChange={(e) =>
                    setMkDialog({
                      open: true,
                      editing: { ...mkDialog.editing!, program_studi_id: e.target.value || null },
                    })
                  }
                >
                  <option value="">Pilih program studi</option>
                  {prodiOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-ink/45 mt-1">
                  Wajib. Mata kuliah diikat ke satu program studi agar penjadwalan & rekap klaster per prodi konsisten.
                </p>
              </div>
              <div>
                <label className="eyebrow block mb-1">{L.label.keterangan} (opsional)</label>
                <textarea
                  className="editorial-input w-full min-h-[64px]"
                  maxLength={300}
                  value={mkDialog.editing.description}
                  onChange={(e) =>
                    setMkDialog({
                      open: true,
                      editing: { ...mkDialog.editing!, description: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button type="button" className="editorial-ghost" onClick={closeMk}>
              {L.dialog.batal}
            </button>
            <button
              type="button"
              className="editorial-cta"
              onClick={() => void saveMk()}
              disabled={
                savingMk
                || !mkDialog.editing?.campus_id.trim()
                || !mkDialog.editing?.program_studi_id
              }
            >
              {savingMk && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {L.dialog.simpan}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Jadwal */}
      <Dialog
        open={jdwDialog.open}
        onOpenChange={(o) => {
          if (!o) closeJdw();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {jdwDialog.editing?.id ? L.dialog.editJadwal : L.dialog.tambahJadwal}
            </DialogTitle>
            <DialogDescription>Pilih mata kuliah, hari, jam mulai–selesai, dan ruang.</DialogDescription>
          </DialogHeader>
          {jdwDialog.editing && (
            <div className="space-y-4">
              <div>
                <label className="eyebrow block mb-1">{L.label.mataKuliah}</label>
                <select
                  className="editorial-input w-full"
                  value={jdwDialog.editing.mata_kuliah_id}
                  onChange={(e) =>
                    setJdwDialog({
                      open: true,
                      editing: { ...jdwDialog.editing!, mata_kuliah_id: e.target.value },
                    })
                  }
                >
                  {mataKuliah.length === 0 && (
                    <option value="">{L.label.tambahMkDulu}</option>
                  )}
                  {mataKuliah.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="eyebrow block mb-1">{L.label.hari}</label>
                  <select
                    className="editorial-input w-full"
                    value={jdwDialog.editing.day_of_week}
                    onChange={(e) =>
                      setJdwDialog({
                        open: true,
                        editing: { ...jdwDialog.editing!, day_of_week: Number(e.target.value) },
                      })
                    }
                  >
                    {DAYS_ID.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1">{L.label.mulai}</label>
                  <input
                    type="time"
                    className="editorial-input w-full"
                    value={jdwDialog.editing.start_time}
                    onChange={(e) =>
                      setJdwDialog({
                        open: true,
                        editing: { ...jdwDialog.editing!, start_time: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">{L.label.selesai}</label>
                  <input
                    type="time"
                    className="editorial-input w-full"
                    value={jdwDialog.editing.end_time}
                    onChange={(e) =>
                      setJdwDialog({
                        open: true,
                        editing: { ...jdwDialog.editing!, end_time: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow block mb-1">{L.label.ruang} (opsional)</label>
                <input
                  className="editorial-input w-full"
                  maxLength={50}
                  value={jdwDialog.editing.room}
                  onChange={(e) =>
                    setJdwDialog({
                      open: true,
                      editing: { ...jdwDialog.editing!, room: e.target.value },
                    })
                  }
                  placeholder="GB-101"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button type="button" className="editorial-ghost" onClick={closeJdw}>
              {L.dialog.batal}
            </button>
            <button
              type="button"
              className="editorial-cta"
              onClick={() => void saveJdw()}
              disabled={savingJdw || !isJdwValid()}
            >
              {savingJdw && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {L.dialog.simpan}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Fakultas */}
      <Dialog
        open={fkDialog.open}
        onOpenChange={(o) => {
          if (!o) setFkDialog({ open: false, editing: null });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {fkDialog.editing?.id ? L.dialog.editFakultas : L.dialog.tambahFakultas}
            </DialogTitle>
            <DialogDescription>
              Fakultas menaungi satu atau lebih jurusan. Pilih kampus asal bila ada.
            </DialogDescription>
          </DialogHeader>
          {fkDialog.editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block mb-1">{L.label.kode}</label>
                  <input
                    className="editorial-input w-full uppercase"
                    maxLength={20}
                    value={fkDialog.editing.code}
                    onChange={(e) =>
                      setFkDialog({
                        open: true,
                        editing: { ...fkDialog.editing!, code: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="FIP"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">{L.label.nama}</label>
                  <input
                    className="editorial-input w-full"
                    maxLength={150}
                    value={fkDialog.editing.name}
                    onChange={(e) =>
                      setFkDialog({
                        open: true,
                        editing: { ...fkDialog.editing!, name: e.target.value },
                      })
                    }
                    placeholder="Fakultas Ilmu Pendidikan"
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow block mb-1">{L.label.keterangan} (opsional)</label>
                <input
                  className="editorial-input w-full"
                  value={fkDialog.editing.description ?? ""}
                  onChange={(e) =>
                    setFkDialog({
                      open: true,
                      editing: { ...fkDialog.editing!, description: e.target.value },
                    })
                  }
                  placeholder="Warna identitas, kontak, dsb."
                />
              </div>
              <div className="flex items-center justify-between h-10 px-3 border border-hairline">
                <span className="text-xs text-ink/55">Aktif</span>
                <Switch
                  checked={fkDialog.editing.is_active}
                  onCheckedChange={(v) =>
                    setFkDialog({
                      open: true,
                      editing: { ...fkDialog.editing!, is_active: v },
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              className="editorial-ghost"
              onClick={() => setFkDialog({ open: false, editing: null })}
            >
              {L.dialog.batal}
            </button>
            <button
              type="button"
              className="editorial-cta"
              onClick={() => void saveFk()}
              disabled={savingFk}
            >
              {savingFk && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {L.dialog.simpan}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Jurusan */}
      <Dialog
        open={jrDialog.open}
        onOpenChange={(o) => {
          if (!o) setJrDialog({ open: false, editing: null });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {jrDialog.editing?.id ? L.dialog.editJurusan : L.dialog.tambahJurusan}
            </DialogTitle>
            <DialogDescription>
              Jurusan berada di bawah fakultas dan menaungi program studi.
            </DialogDescription>
          </DialogHeader>
          {jrDialog.editing && (
            <div className="space-y-4">
              <div>
                <label className="eyebrow block mb-1">{L.label.fakultasInduk}</label>
                <select
                  className="editorial-input w-full"
                  value={jrDialog.editing.fakultas_id}
                  onChange={(e) =>
                    setJrDialog({
                      open: true,
                      editing: { ...jrDialog.editing!, fakultas_id: e.target.value },
                    })
                  }
                >
                  {fakultasList.length === 0 && (
                    <option value="">{L.label.tambahFakultasDulu}</option>
                  )}
                  {fakultasList.map((fk) => (
                    <option key={fk.id} value={fk.id}>
                      {fk.code} - {fk.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block mb-1">{L.label.kode}</label>
                  <input
                    className="editorial-input w-full uppercase"
                    maxLength={20}
                    value={jrDialog.editing.code}
                    onChange={(e) =>
                      setJrDialog({
                        open: true,
                        editing: { ...jrDialog.editing!, code: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="TP"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">{L.label.nama}</label>
                  <input
                    className="editorial-input w-full"
                    maxLength={150}
                    value={jrDialog.editing.name}
                    onChange={(e) =>
                      setJrDialog({
                        open: true,
                        editing: { ...jrDialog.editing!, name: e.target.value },
                      })
                    }
                    placeholder="Teknik Pendidikan"
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow block mb-1">{L.label.keterangan} (opsional)</label>
                <input
                  className="editorial-input w-full"
                  value={jrDialog.editing.description ?? ""}
                  onChange={(e) =>
                    setJrDialog({
                      open: true,
                      editing: { ...jrDialog.editing!, description: e.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between h-10 px-3 border border-hairline">
                <span className="text-xs text-ink/55">Aktif</span>
                <Switch
                  checked={jrDialog.editing.is_active}
                  onCheckedChange={(v) =>
                    setJrDialog({
                      open: true,
                      editing: { ...jrDialog.editing!, is_active: v },
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              className="editorial-ghost"
              onClick={() => setJrDialog({ open: false, editing: null })}
            >
              {L.dialog.batal}
            </button>
            <button
              type="button"
              className="editorial-cta"
              onClick={() => void saveJr()}
              disabled={savingJr}
            >
              {savingJr && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {L.dialog.simpan}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Program Studi */}
      <Dialog
        open={pdDialog.open}
        onOpenChange={(o) => {
          if (!o) setPdDialog({ open: false, editing: null });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {pdDialog.editing?.id ? L.dialog.editProgramStudi : L.dialog.tambahProgramStudi}
            </DialogTitle>
            <DialogDescription>
              Program studi adalah unit terkecil pada struktur akademik. Pilih jurusan induk bila tersedia.
            </DialogDescription>
          </DialogHeader>
          {pdDialog.editing && (
            <div className="space-y-4">
              <div>
                <label className="eyebrow block mb-1">{L.label.jurusanInduk} (opsional)</label>
                <select
                  className="editorial-input w-full"
                  value={(pdDialog.editing.jurusan_id as string | null | undefined) ?? ""}
                  onChange={(e) =>
                    setPdDialog({
                      open: true,
                      editing: {
                        ...pdDialog.editing!,
                        jurusan_id: e.target.value || null,
                      } as ProgramStudi,
                    })
                  }
                >
                  {fakultasList.map((fk) => {
                    const jrs = jurusansByFakultas(fk.id);
                    if (jrs.length === 0) return null;
                    return (
                      <optgroup key={fk.id} label={`${fk.code} - ${fk.name}`}>
                        {jrs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.code} - {j.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block mb-1">{L.label.kode}</label>
                  <input
                    className="editorial-input w-full uppercase"
                    maxLength={20}
                    value={pdDialog.editing.code}
                    onChange={(e) =>
                      setPdDialog({
                        open: true,
                        editing: { ...pdDialog.editing!, code: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="IF"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">{L.label.nama}</label>
                  <input
                    className="editorial-input w-full"
                    maxLength={150}
                    value={pdDialog.editing.name}
                    onChange={(e) =>
                      setPdDialog({
                        open: true,
                        editing: { ...pdDialog.editing!, name: e.target.value },
                      })
                    }
                    placeholder="Teknik Informatika"
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow block mb-1">{L.label.keterangan} (opsional)</label>
                <input
                  className="editorial-input w-full"
                  value={pdDialog.editing.description ?? ""}
                  onChange={(e) =>
                    setPdDialog({
                      open: true,
                      editing: { ...pdDialog.editing!, description: e.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between h-10 px-3 border border-hairline">
                <span className="text-xs text-ink/55">Aktif</span>
                <Switch
                  checked={pdDialog.editing.is_active}
                  onCheckedChange={(v) =>
                    setPdDialog({
                      open: true,
                      editing: { ...pdDialog.editing!, is_active: v },
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              className="editorial-ghost"
              onClick={() => setPdDialog({ open: false, editing: null })}
            >
              {L.dialog.batal}
            </button>
            <button
              type="button"
              className="editorial-cta"
              onClick={() => void savePd()}
              disabled={savingPd}
            >
              {savingPd && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {L.dialog.simpan}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
