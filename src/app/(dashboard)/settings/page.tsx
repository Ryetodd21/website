"use client";
import {useEffect, useMemo, useState } from "react";
import {
  Crosshair,
  Eye,
  EyeOff,
  GraduationCap,
  FileText,
  Key,
  Loader2,
  MapPin,
  Save,
  Search,
  Shield,
  Smartphone,
  Trash2,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { GlassCard, SectionHeader, StatusBadge } from "@/components/metrics";
import { PageHeader } from "@/components/metrics/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HereMapPicker } from "@/components/maps/here-map";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInstitution } from "@/lib/institution";
import { useUserProfile } from "@/lib/user-profile";
import { useSaveState } from "@/hooks/use-save-state";
import { useDirtyState } from "@/hooks/use-dirty-state";
import {
  Campus,
  CampusInput,
  createCampus,
  deleteCampus,
  getCampuses,
  updateCampus,
  User,
  UserInput,
  UserRole,
  UserUpdate,
  apiFetch,
  deleteUser,
  getUsers,
  updateUser,
  getProgramStudi,
  createProgramStudi,
  type ProgramStudi,
  getFakultas,
  getJurusan,
  updateInstitutionSettings,
  type Jurusan,
  type Fakultas,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { DEFAULT_CAMPUS_CENTER } from "@/lib/campus";

const DEFAULT_CENTER = DEFAULT_CAMPUS_CENTER; // alias — re-exported for local readability

// ─── Tab definition (editorial numbered nav) ─────────────────────────────

type TabKey = "institution" | "campuses" | "users" | "security" | "notifications";

const TABS: { key: TabKey; label: string; eyebrow: string; adminOnly?: boolean }[] = [
  { key: "institution",   label: "Profil Institusi",  eyebrow: "01 · Identitas" },
  { key: "campuses",      label: "Titik Kampus",      eyebrow: "02 · Geofence" },
  { key: "users",         label: "Kelola Akun",       eyebrow: "03 · Akun" },
  { key: "security",      label: "Keamanan",          eyebrow: "04 · Server", adminOnly: true },
  { key: "notifications", label: "Notifikasi",        eyebrow: "05 · Preferensi" },
];

// Akademik dipindah ke route terpisah di /akademik supaya bisa diakses lewat
// navigasi sidebar (lihat app-sidebar.tsx). State CRUD ada di halaman itu.

export default function SettingsPage() {
  const { profile } = useUserProfile();
  const role = (profile.role || "").toLowerCase().trim();
  const isAdmin = role === "admin";

  const [tab, setTab] = useState<TabKey>("institution");
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  const [notifications, setNotifications] = useState(() => {
    if (typeof window === "undefined") {
      return { trainingFailed: true, newStudent: true, reportReady: false };
    }
    try {
      const saved = localStorage.getItem("notification_prefs");
      return saved ? JSON.parse(saved) : {
        trainingFailed: true,
        newStudent: true,
        reportReady: false,
      };
    } catch {
      return { trainingFailed: true, newStudent: true, reportReady: false };
    }
  });

  return (
    <div className="space-y-5 py-4">
      <PageHeader
        number="07"
        title="Pengaturan"
        subtitle="Kelola konfigurasi institusi, geofence kampus, akun pengguna, dan preferensi sistem."
      />

      {/* Two-column: editorial numbered nav (sidebar pattern) + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
        {/* Tab nav — numbered typographic rows (matches app-sidebar pattern) */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <span className="eyebrow-sm text-ink/45">Bagian</span>
          <ol className="mt-3 border-t border-hairline">
            {visibleTabs.map((t, i) => {
              const isActive = tab === t.key;
              return (
                <li key={t.key} className="border-b border-hairline">
                  <button
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "group/row flex w-full items-center gap-3 py-2.5 px-3 -mx-3 text-left transition-colors",
                      isActive ? "bg-ink/[0.03]" : "hover:bg-ink/[0.02]"
                    )}
                  >
                    <span
                      className={cn(
                        "eyebrow-sm tabular-nums shrink-0",
                        isActive ? "text-ink" : "text-ink/40"
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-ink/25 font-mono shrink-0">/</span>
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-ink" : "text-ink/55"
                      )}
                    >
                      {t.label}
                    </span>
                    {isActive && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 border border-hairline p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="eyebrow-sm text-ink mb-1.5">Hanya Admin &amp; Dosen</p>
                <p className="text-[11px] text-ink/55 leading-relaxed">
                  Halaman ini dikhususkan untuk staff. Mahasiswa mengelola data
                  lewat aplikasi mobile Android.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content — single editorial panel per tab */}
        <div className="min-w-0">
          {tab === "institution"   && <InstitutionTab />}
          {tab === "campuses"      && <CampusTab />}
          {tab === "users"         && <UsersTab />}
          {tab === "security"      && isAdmin && <SecurityTab />}
          {tab === "notifications" && (
            <NotificationsTab
              value={notifications}
              onChange={setNotifications}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications tab ───────────────────────────────────────────────────

interface NotificationPrefs {
  trainingFailed: boolean;
  newStudent: boolean;
  reportReady: boolean;
}

function NotificationsTab({
  value,
  onChange,
}: {
  value: NotificationPrefs;
  onChange: (next: NotificationPrefs) => void;
}) {
  const ITEMS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: "trainingFailed", label: "Training Gagal",     desc: "Kirim notifikasi saat training model gagal" },
    { key: "newStudent",     label: "Mahasiswa Baru",     desc: "Kirim notifikasi saat mahasiswa baru mendaftar" },
    { key: "reportReady",    label: "Laporan Bulanan",    desc: "Kirim notifikasi saat laporan bulanan siap" },
  ];

  return (
    <GlassCard>
      <SectionHeader
        number="05"
        title="Preferensi Notifikasi"
        sub="Atur notifikasi untuk admin dan dosen PA"
      />
      <div className="border-t border-hairline">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 px-5 py-4 border-b border-hairline last:border-b-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{item.label}</p>
              <p className="text-[11px] text-ink/55 mt-1 leading-relaxed">{item.desc}</p>
            </div>
            <Switch
              checked={value[item.key]}
              onCheckedChange={(checked) =>
                onChange({ ...value, [item.key]: checked })
              }
            />
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t divider-soft flex items-center justify-between">
        <span className="eyebrow-sm text-ink/45">Hanya di browser ini</span>
        <button
          type="button"
          className="editorial-cta"
          onClick={() => {
            localStorage.setItem("notification_prefs", JSON.stringify(value));
            toast.success("Preferensi notifikasi disimpan");
          }}
        >
          <Save className="h-3.5 w-3.5" />
          Simpan Preferensi
        </button>
      </div>
    </GlassCard>
  );
}

// ─── Security tab ────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <GlassCard>
      <SectionHeader
        number="04"
        title="Pengaturan Keamanan"
        sub="JWT secret, session timeout, dan role-based access"
      />
      <div className="px-5 py-5 space-y-5 border-t border-hairline">
        <div className="border border-warning/40 bg-warning/[0.06] px-4 py-3">
          <p className="eyebrow-sm text-warning inline-flex items-center gap-1.5 mb-1">⚠ Perhatian</p>
          <p className="text-xs text-ink/70 leading-relaxed">
            Pengaturan JWT secret dan token expiry hanya bisa diubah melalui file
            konfigurasi server (<code className="font-mono">.env</code>). Hubungi
            administrator server untuk mengubah nilai ini.
          </p>
        </div>

        <div>
          <label className="eyebrow block mb-2">JWT Secret Key</label>
          <div className="flex gap-3 items-end">
            <input
              type="password"
              defaultValue="••••••••••••••••••••••••••••••••"
              className="editorial-input font-mono"
              disabled
            />
            <button
              type="button"
              disabled
              title="Ubah melalui konfigurasi server"
              className="editorial-ghost shrink-0"
            >
              Generate Baru
            </button>
          </div>
          <p className="text-[10px] text-ink/45 mt-2">
            Minimal 32 karakter. Jika diubah, semua token aktif akan di-revoke.
          </p>
        </div>

        <Separator />

        <div>
          <label className="eyebrow block mb-2">Token Expiry</label>
          <div className="flex items-center gap-3">
            <span className="editorial-input font-mono max-w-[8rem] flex items-center px-3 py-2 text-ink/55 cursor-not-allowed">
              —
            </span>
            <span className="text-sm text-ink/55">dikelola server</span>
          </div>
          <p className="text-[10px] text-ink/45 mt-2">
            Masa hidup token disetel via <code className="font-mono">ACCESS_TOKEN_EXPIRE_MINUTES</code> di konfigurasi server. Hubungi admin untuk mengubah.
          </p>
        </div>

        <Separator />

        <div>
          <label className="eyebrow block mb-2">Kedaluwarsa Token Penyegar</label>
          <div className="flex items-center gap-3">
            <span className="editorial-input font-mono max-w-[8rem] flex items-center px-3 py-2 text-ink/55 cursor-not-allowed">
              —
            </span>
            <span className="text-sm text-ink/55">dikelola server</span>
          </div>
          <p className="text-[10px] text-ink/45 mt-2">
            Masa hidup refresh token disetel via <code className="font-mono">REFRESH_TOKEN_EXPIRE_DAYS</code> di konfigurasi server. Hubungi admin untuk mengubah.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button type="button" disabled title="Ubah melalui konfigurasi server" className="editorial-cta opacity-50 cursor-not-allowed">
            <Shield className="h-3.5 w-3.5" />
            Simpan Keamanan
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Users tab ───────────────────────────────────────────────────────────

interface EditableUser {
  id?: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  full_name: string;
  jabatan: string;
  jurusan: string;
  nip: string;
  role: UserRole;
  is_active: boolean;
}

const EMPTY_USER: EditableUser = {
  username: "",
  email: "",
  password: "",
  full_name: "",
  jabatan: "",
  jurusan: "",
  nip: "",
  role: "dosen",
  is_active: true,
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin",     label: "Admin" },
  { value: "dosen",     label: "Dosen" },
  { value: "mahasiswa", label: "Mahasiswa" },
];

// Dosen can only register mahasiswa accounts — admin/dosen promotion is admin-only.
// Mirrors the backend gate in app/routers/users.py:create_user which requires
// `role in ("admin", "dosen")` to use this endpoint.
function availableRoleOptions(currentRole: UserRole): { value: UserRole; label: string }[] {
  if (currentRole === "admin") return ROLE_OPTIONS;
  // Dosen: cannot create admin accounts (only admin role can manage roles at that level)
  // Cannot create another dosen (admin-only) — only "mahasiswa".
  return ROLE_OPTIONS.filter((r) => r.value === "mahasiswa" || r.value === currentRole);
}

function roleLabel(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Compact role badge for the user-table row — colored dot + uppercase label,
// no filled background. Per-role hue matches the dashboard palette so admins
// spot privileged accounts at a glance. Mahasiswa is extra-bold per Round 8:
// it's the most common role in the table and was previously hard to read at a
// glance, so it gets an explicit font-weight bump.
function RolePill({ role }: { role: string }) {
  const map: Record<string, { dot: string; label: string; weight: string }> = {
    admin: { dot: "bg-[oklch(0.55_0.22_340)]", label: "ADMIN", weight: "font-medium" },
    dosen: { dot: "bg-primary", label: "DOSEN", weight: "font-medium" },
    mahasiswa: { dot: "bg-ink/55", label: "MAHASISWA", weight: "font-extrabold" },
  };
  const m = map[role] ?? { dot: "bg-ink/45", label: role.toUpperCase(), weight: "font-medium" };
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0 px-1.5 py-0.5 border border-hairline">
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden="true" />
      <span className={`text-[9px] font-mono tracking-wider text-ink/70 ${m.weight}`}>
        {m.label}
      </span>
    </span>
  );
}

function randomPassword(): string {
  // 12 chars, mixed case + digits — generated via crypto for production safety
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

type Strength = "lemah" | "sedang" | "kuat";
function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3; label: Strength; color: string } {
  if (!pwd) return { score: 0, label: "lemah", color: "bg-hairline" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const finalScore = Math.min(3, score) as 0 | 1 | 2 | 3;
  if (finalScore <= 1) return { score: finalScore, label: "lemah", color: "bg-destructive" };
  if (finalScore === 2) return { score: finalScore, label: "sedang", color: "bg-warning" };
  return { score: finalScore, label: "kuat", color: "bg-success" };
}

function suggestUsername(fullName: string, email: string): string {
  const fromEmail = email.split("@")[0]?.trim();
  if (fromEmail) return fromEmail.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleaned = fullName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  return cleaned.replace(/\s+/g, ".");
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Akses penuh ke semua fitur sistem",
  dosen: "Dosen PA, akses monitoring & laporan mahasiswa bimbingan",
  mahasiswa: "Mahasiswa bimbingan, data dilacak oleh dosen PA",
};

const MAX_USERS_PER_TAB = 15;

interface UsersTableProps {
  rows: User[];
  loading: boolean;
  openEdit: (u: User) => void;
  toggleActive: (u: User, active: boolean) => void | Promise<void>;
  remove: (u: User) => Promise<void>;
  emptyLabel: string;
}

function UsersTable({ rows, loading, openEdit, toggleActive, remove, emptyLabel }: UsersTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.jabatan || "").toLowerCase().includes(q) ||
        (u.jurusan || "").toLowerCase().includes(q) ||
        (u.nip || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MAX_USERS_PER_TAB));
  // Reset page whenever the filtered set shrinks below the current page
  // (e.g. after a search narrows results). Otherwise we keep the page stable.
  useEffect(() => {
    // Pagination cap — single setState to clamp, not a render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * MAX_USERS_PER_TAB;
  const visible = filtered.slice(start, start + MAX_USERS_PER_TAB);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink/55">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat akun…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/45" />
          <input
            placeholder="Cari nama, email, NIP/NIM..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="editorial-input pl-7"
          />
        </div>
        <Badge variant="outline" className="text-[10px] font-semibold tabular-nums rounded-none">
          {filtered.length} total · tampil {visible.length}
        </Badge>
      </div>

      <div className="border-t border-hairline">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="eyebrow-sm text-ink/45">Nama</TableHead>
              <TableHead className="eyebrow-sm text-ink/45">Jabatan</TableHead>
              <TableHead className="eyebrow-sm text-ink/45">Jurusan</TableHead>
              <TableHead className="eyebrow-sm text-ink/45">NIP / NIM</TableHead>
              <TableHead className="eyebrow-sm text-ink/45">Peran</TableHead>
              <TableHead className="eyebrow-sm text-ink/45">Status</TableHead>
              <TableHead className="eyebrow-sm text-ink/45 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-ink/55">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 bg-ink/[0.04] flex items-center justify-center text-[11px] font-bold text-ink shrink-0">
                        {getInitials(u.full_name || u.username)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-ink truncate">{u.full_name || u.username}</span>
                          <RolePill role={u.role} />
                        </div>
                        <div className="text-[10px] text-ink/45 truncate">
                          @{u.username} · {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{u.jabatan || <span className="text-ink/35 font-mono">kosong</span>}</TableCell>
                  <TableCell className="text-xs">{u.jurusan || <span className="text-ink/35 font-mono">kosong</span>}</TableCell>
                  <TableCell className="font-mono text-xs">{u.nip || <span className="text-ink/35">-</span>}</TableCell>
                  <TableCell>
                    <StatusBadge
                      type={u.role === "admin" ? "active" : u.role === "dosen" ? "training" : "completed"}
                      label={roleLabel(u.role)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.is_active}
                      onCheckedChange={(v) => void toggleActive(u, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="editorial-ghost text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(u)}
                        className="editorial-ghost text-[11px] text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t divider-soft">
          <span className="eyebrow text-ink/55 tabular-nums">
            Halaman {page} dari {totalPages} · {filtered.length} akun
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="editorial-ghost text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="editorial-ghost text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Halaman berikutnya"
            >
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditableUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGenerated, setShowGenerated] = useState<{ pwd: string; username: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [showProdiDialog, setShowProdiDialog] = useState(false);

  // Pull the current viewer's role from the shared profile context so we can
  // gate the role dropdown (dosen may only create mahasiswa) and route the
  // POST to /api/users/create-student vs. /api/users. Without these locals
  // the outer SettingsPage `role`/`isAdmin` aren't in scope here.
  const { profile } = useUserProfile();
  const role = (profile.role || "").toLowerCase().trim();
  const isAdmin = role === "admin";

  useEffect(() => {
    const ctrl = new AbortController();
    void getUsers({ signal: ctrl.signal })
      .then(list => { if (!ctrl.signal.aborted) setUsers(list); })
      .catch(error => { if (!ctrl.signal.aborted) toast.error(`Gagal memuat akun: ${error instanceof Error ? error.message : String(error)}`); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    void getProgramStudi({ signal: ctrl.signal })
      .then(list => { if (!ctrl.signal.aborted) setProdiList(list); })
      .catch(() => { if (!ctrl.signal.aborted) setProdiList([]); });
    return () => ctrl.abort();
  }, []);

  function openNew() {
    setEditing({ ...EMPTY_USER });
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing({
      id: u.id,
      username: u.username,
      email: u.email,
      password: "",
      full_name: u.full_name,
      jabatan: u.jabatan,
      jurusan: u.jurusan,
      nip: u.nip,
      role: u.role,
      is_active: u.is_active,
    });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
  }

  async function save() {
    if (!editing) return;
    if (!editing.username.trim() || !editing.email.trim()) {
      toast.error("Username dan email wajib diisi");
      return;
    }
    if (!editing.id && !editing.password) {
      toast.error("Password wajib diisi untuk akun baru");
      return;
    }
    if (editing.password && editing.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (editing.password && !editing.id && editing.password !== editing.confirmPassword) {
      toast.error("Password dan konfirmasi tidak cocok");
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        const data: UserUpdate = {
          username: editing.username.trim(),
          email: editing.email.trim(),
          full_name: editing.full_name.trim(),
          jabatan: editing.jabatan.trim(),
          jurusan: editing.jurusan.trim(),
          nip: editing.nip.trim(),
          role: editing.role,
          is_active: editing.is_active,
        };
        if (editing.password) data.password = editing.password;
        const updated = await updateUser(editing.id, data);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        toast.success("Akun diperbarui");
        close();
      } else {
        const input: UserInput = {
          username: editing.username.trim(),
          email: editing.email.trim(),
          password: editing.password,
          full_name: editing.full_name.trim(),
          jabatan: editing.jabatan.trim(),
          jurusan: editing.jurusan.trim(),
          nip: editing.nip.trim(),
          role: editing.role,
          is_active: editing.is_active,
        };
        // Dosen route to /api/users/create-student (mahasiswa-only); admin uses
        // the unrestricted /api/users endpoint. Without this split, a dosen would
        // see the form but get 403 on submit because POST /api/users is admin-only.
        const endpoint = isAdmin
          ? "/api/users"
          : "/api/users/create-student";
        const created = await apiFetch<User>(endpoint, {
          method: "POST",
          body: JSON.stringify(input),
        });
        setUsers((prev) => [created, ...prev]);
        setShowGenerated({
          username: created.username,
          pwd: editing.password,
        });
        toast.success("Akun berhasil dibuat");
        close();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: User) {
    if (!confirm(`Hapus akun "${u.username}"? Token login akan ikut terhapus.`)) return;
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success("Akun dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function toggleActive(u: User, active: boolean) {
    try {
      const updated = await updateUser(u.id, { is_active: active });
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <GlassCard>
      <SectionHeader
        number="03"
        title="Kelola Akun"
        sub="Tambah, edit, atau nonaktifkan akun pengguna"
        right={
          <button type="button" onClick={openNew} className="editorial-cta">
            <Users className="h-3.5 w-3.5" />
            Tambah Akun
          </button>
        }
      />

      {/* Generated password banner — shown briefly after creating a new account */}
      {showGenerated && (
        <div className="mx-5 mt-4 border border-warning/40 bg-warning/[0.06] p-3 flex items-start gap-3">
          <Key className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ink">
              Akun &ldquo;{showGenerated.username}&rdquo; berhasil dibuat
            </p>
            <p className="text-[11px] text-ink/55 mt-0.5">
              Password sementara:{" "}
              <code className="font-mono font-bold bg-ink/[0.04] px-1.5 py-0.5">
                {showGenerated.pwd}
              </code>
              {" "}Catat dan sampaikan ke pengguna. Tidak ditampilkan lagi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGenerated(null)}
            className="text-warning hover:underline text-xs shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      <Tabs>
        <TabsList className="mx-5 mt-2 border-b border-hairline bg-transparent p-0 gap-0">
          <TabsTrigger value="staff" icon={<Shield className="h-3.5 w-3.5" />}>
            Dosen &amp; Admin
          </TabsTrigger>
          <TabsTrigger value="students" icon={<GraduationCap className="h-3.5 w-3.5" />}>
            Mahasiswa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="staff">
          <UsersTable
            rows={users.filter((u) => u.role === "admin" || u.role === "dosen")}
            loading={loading}
            openEdit={openEdit}
            toggleActive={toggleActive}
            remove={remove}
            emptyLabel="Belum ada akun dosen/admin."
          />
        </TabsContent>
        <TabsContent value="students">
          <UsersTable
            rows={users.filter((u) => u.role === "mahasiswa")}
            loading={loading}
            openEdit={openEdit}
            toggleActive={toggleActive}
            remove={remove}
            emptyLabel="Belum ada akun mahasiswa."
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit dialog */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      >
        <DialogContent className="sm:max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col p-0 rounded-none border border-hairline bg-paper">
          <DialogHeader className="px-7 pt-5 pb-4 border-b border-hairline shrink-0">
            <DialogTitle className="text-lg display-sans flex items-center gap-2.5 text-ink">
              <span className="flex h-9 w-9 items-center justify-center border border-hairline text-primary">
                <Users className="h-5 w-5" strokeWidth={2.25} />
              </span>
              {editing?.id ? "Edit Akun" : "Tambah Akun"}
            </DialogTitle>
            <DialogDescription className="text-xs mt-1.5">
              Isi data pengguna. Password hanya disimpan saat create atau saat diubah.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="overflow-y-auto px-7 py-5 space-y-6">
              {/* Identitas */}
              <fieldset className="space-y-3">
                <legend className="eyebrow block mb-3">Identitas</legend>
                <div className="grid grid-cols-12 gap-4 items-start">
                  {/* Avatar preview */}
                  <div className="col-span-2 flex flex-col items-center gap-2">
                    <div className="h-20 w-20 bg-ink/[0.04] flex items-center justify-center text-2xl font-bold text-ink border border-hairline">
                      {getInitials(editing.full_name || editing.username || "?")}
                    </div>
                    <p className="text-[10px] text-ink/45 text-center leading-tight">
                      Preview avatar
                      <br />dari nama
                    </p>
                  </div>
                  <div className="col-span-5">
                    <label className="eyebrow block mb-1.5">
                      Nama Lengkap <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={editing.full_name}
                      onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                      placeholder="Cth: Dr. Ahmad Hasan, M.Kom."
                      className="editorial-input"
                      autoFocus
                    />
                    <p className="text-[10px] text-ink/45 mt-1.5">
                      Nama lengkap dengan gelar (jika ada)
                    </p>
                  </div>
                  {editing.role !== "mahasiswa" && (
                    <div className="col-span-5">
                      <label className="eyebrow block mb-1.5">Jabatan</label>
                      <input
                        value={editing.jabatan}
                        onChange={(e) => setEditing({ ...editing, jabatan: e.target.value })}
                        placeholder="Cth: Dosen PA"
                        className="editorial-input"
                      />
                      <p className="text-[10px] text-ink/45 mt-1.5">
                        Jabatan / posisi di institusi
                      </p>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Akun */}
              <fieldset className="space-y-3">
                <legend className="eyebrow block mb-3">Akun</legend>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4">
                    <label className="eyebrow block mb-1.5">
                      Username <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={editing.username}
                      onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                      onBlur={() => {
                        if (!editing.username.trim() && (editing.full_name || editing.email)) {
                          setEditing({
                            ...editing,
                            username: suggestUsername(editing.full_name, editing.email),
                          });
                        }
                      }}
                      placeholder="username"
                      className="editorial-input font-mono"
                    />
                    <p className="text-[10px] text-ink/45 mt-1.5">
                      Login ID unik. Kosongkan = otomatis.
                    </p>
                  </div>
                  <div className="col-span-4">
                    <label className="eyebrow block mb-1.5">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={editing.email}
                      onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                      placeholder="user@ung.ac.id"
                      className="editorial-input"
                    />
                    <p className="text-[10px] text-ink/45 mt-1.5">
                      Email valid untuk notifikasi & reset password
                    </p>
                  </div>
                  <div className="col-span-4">
                    <label className="eyebrow block mb-1.5">
                      Peran <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={editing.role}
                      onChange={(e) => setEditing({ ...editing, role: e.target.value as UserRole })}
                      className="editorial-input"
                    >
                      {availableRoleOptions(role as UserRole).map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-ink/45 mt-1.5 leading-tight">
                      {ROLE_DESCRIPTIONS[editing.role]}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <label className="eyebrow block mb-1.5">
                      {editing.id ? "Password Baru" : "Password"}
                      {!editing.id && <span className="text-destructive"> *</span>}
                      {editing.id && (
                        <span className="font-normal text-ink/45 text-[10px] ml-1">(opsional, kosongkan jika tidak diubah)</span>
                      )}
                    </label>
                    <div className="flex gap-2 items-end">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editing.password}
                          onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                          placeholder={editing.id ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                          className="editorial-input font-mono pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-ink/45 hover:text-ink transition-colors"
                          title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {!editing.id && (
                        <button
                          type="button"
                          title="Generate password acak"
                          onClick={() => {
                            const pwd = randomPassword();
                            setEditing({ ...editing, password: pwd });
                            setShowPassword(true);
                          }}
                          className="editorial-ghost shrink-0"
                        >
                          <Key className="h-3.5 w-3.5" />
                          Generate
                        </button>
                      )}
                    </div>
                    {!editing.id && editing.password && (() => {
                      const s = passwordStrength(editing.password);
                      return (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1 bg-hairline">
                            <div
                              className={`h-full ${s.color} transition-all duration-300`}
                              style={{ width: `${((s.score + 1) / 4) * 100}%` }}
                            />
                          </div>
                          <span className={`eyebrow-sm ${
                            s.label === "kuat" ? "text-success" :
                            s.label === "sedang" ? "text-warning" : "text-destructive"
                          }`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="col-span-4">
                    <label className="eyebrow block mb-1.5">
                      Konfirmasi {!editing.id && <span className="text-destructive">*</span>}
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editing.confirmPassword || ""}
                      onChange={(e) => setEditing({ ...editing, confirmPassword: e.target.value })}
                      placeholder="Ulangi password"
                      className="editorial-input font-mono"
                    />
                    {editing.password && editing.confirmPassword && editing.password !== editing.confirmPassword && (
                      <p className="text-[10px] text-destructive mt-1.5">
                        Password tidak cocok
                      </p>
                    )}
                    {editing.password && editing.confirmPassword && editing.password === editing.confirmPassword && (
                      <p className="text-[10px] text-success mt-1.5 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Password cocok
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Institusi */}
              <fieldset className="space-y-3">
                <legend className="eyebrow block mb-3">Institusi</legend>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4">
                    <label className="eyebrow block mb-1.5">
                      {editing.role === "mahasiswa" ? "NIM" : "NIP"}
                    </label>
                    <input
                      value={editing.nip}
                      onChange={(e) => setEditing({ ...editing, nip: e.target.value })}
                      placeholder={editing.role === "mahasiswa" ? "411423XXX" : "198501012010121001"}
                      className="editorial-input font-mono"
                    />
                    <p className="text-[10px] text-ink/45 mt-1.5">
                      {editing.role === "mahasiswa"
                        ? "Nomor Induk Mahasiswa UNG"
                        : "Nomor Induk Pegawai (18 digit)"}
                    </p>
                  </div>
                  <div className="col-span-4">
                    <label className="eyebrow block mb-1.5">Jurusan / Prodi</label>
                    <select
                      value={editing.jurusan}
                      onChange={async (e) => {
                        const v = e.target.value;
                        if (v === "__add_new__") {
                          setShowProdiDialog(true);
                          return;
                        }
                        setEditing({ ...editing, jurusan: v });
                      }}
                      className="editorial-input w-full"
                    >
                      <option value="">Pilih program studi</option>
                      {prodiList.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.code}, {p.name}
                        </option>
                      ))}
                      <option value="__add_new__">+ Tambah Prodi Baru…</option>
                    </select>
                    <p className="text-[10px] text-ink/45 mt-1.5">
                      Pilih dari daftar atau tambah baru (admin only)
                    </p>
                  </div>
                  <div className="col-span-4">
                    <label className="eyebrow block mb-1.5">Visibilitas Akun</label>
                    <div className="flex items-center justify-between h-10 px-3 border border-hairline">
                      <span
                        className={`text-xs text-ink/55 ${
                          editing.role === "mahasiswa" ? "font-extrabold text-ink" : ""
                        }`}
                      >
                        {editing.is_active ? "Bisa login" : "Login dinonaktifkan"}
                      </span>
                      <Switch
                        checked={editing.is_active}
                        onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                      />
                    </div>
                    <p className="text-[10px] text-ink/45 mt-1.5">
                      Nonaktifkan untuk melarang login tanpa hapus data
                    </p>
                  </div>
                </div>
              </fieldset>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 shrink-0 bg-paper px-7 py-4 gap-2 border-t border-hairline">
            <button
              type="button"
              onClick={close}
              disabled={saving}
              className="editorial-ghost"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="editorial-cta"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {editing?.id ? "Simpan Perubahan" : "Buat Akun"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline "Tambah Prodi" dialog — opens when the user picks the
          sentinel option from the Jurusan select. Closes back to the user
          dialog so the freshly-created prodi is selectable without losing
          the in-progress user form. */}
      <Dialog open={showProdiDialog} onOpenChange={setShowProdiDialog}>
        <DialogContent className="bg-paper border border-hairline max-w-md">
          <DialogHeader className="px-7 pt-6 pb-4 border-b border-hairline">
            <DialogTitle className="display-sans text-xl">Program Studi Baru</DialogTitle>
            <DialogDescription className="text-xs text-ink/55">
              Daftar program studi akan tersedia untuk semua akun baru.
            </DialogDescription>
          </DialogHeader>
          <form
            className="px-7 py-5 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const code = String(fd.get("code") || "").trim().toUpperCase();
              const name = String(fd.get("name") || "").trim();
              const description = String(fd.get("description") || "").trim();
              if (!code || !name) {
                toast.error("Code dan nama wajib diisi");
                return;
              }
              try {
                const created = await createProgramStudi({ code, name, description });
                setProdiList((prev) => [...prev, created]);
                setEditing((cur) => (cur ? { ...cur, jurusan: created.name } : cur));
                toast.success(`Prodi ${created.code} ditambahkan`);
                setShowProdiDialog(false);
              } catch (err) {
                toast.error(
                  `Gagal: ${err instanceof Error ? err.message : String(err)}`
                );
              }
            }}
          >
            <div>
              <label className="eyebrow block mb-1.5">Code (singkat)</label>
              <input
                name="code"
                required
                maxLength={20}
                placeholder="IF"
                className="editorial-input w-full uppercase"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Nama Lengkap</label>
              <input
                name="name"
                required
                maxLength={150}
                placeholder="Teknik Informatika"
                className="editorial-input w-full"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Keterangan (opsional)</label>
              <input
                name="description"
                maxLength={300}
                placeholder="Fakultas Teknik"
                className="editorial-input w-full"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProdiDialog(false)}
                className="editorial-ghost"
              >
                Batal
              </button>
              <button type="submit" className="editorial-cta">
                Simpan
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

// ─── Minimal Tabs (editorial underline) — local copy to avoid shadcn Tabs chrome

function Tabs({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-6", className)} role="tablist">
      {children}
    </div>
  );
}

function TabsTrigger({
  value,
  children,
  icon,
}: {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  // Active state is tracked via data attributes so siblings can read each other.
  return (
    <button
      type="button"
      role="tab"
      data-tab={value}
      onClick={(e) => {
        const root = (e.currentTarget.closest("[role='tablist']") as HTMLElement | null)?.parentElement;
        if (!root) return;
        root.querySelectorAll("[role='tab']").forEach((el) => el.setAttribute("data-state", "inactive"));
        e.currentTarget.setAttribute("data-state", "active");
        // Hide/show panels
        root.querySelectorAll("[data-tabpanel]").forEach((p) => {
          (p as HTMLElement).hidden = p.getAttribute("data-tabpanel") !== value;
        });
      }}
      className={cn(
        "group/tab flex items-center gap-2 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
        "data-[state=active]:text-ink data-[state=active]:border-primary",
        "data-[state=inactive]:text-ink/55 data-[state=inactive]:border-transparent hover:text-ink"
      )}
      data-state="inactive"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <div role="tabpanel" data-tabpanel={value} hidden={value !== "staff"}>
      {children}
    </div>
  );
}

// ─── Institution tab ─────────────────────────────────────────────────────

function InstitutionTab() {
  const { profile, setProfile } = useInstitution();
  const { profile: userProfile } = useUserProfile();
  const isAdmin = userProfile.role === "admin";

  const [faculty, setFaculty] = useState(profile.faculty);
  const [program, setProgram] = useState(profile.program);
  const [timeZone, setTimeZone] = useState(profile.timeZone);

  const formState = { faculty, program, timeZone };
  const formBaseline = { faculty: profile.faculty, program: profile.program, timeZone: profile.timeZone };
  const { isDirty, reset: resetDirty } = useDirtyState(
    formState as unknown as Record<string, unknown>,
    formBaseline as unknown as Record<string, unknown>,
  );

  const { isSaving, isSaved, save: doSave } = useSaveState(
    async () => {
      if (!isAdmin) return;
      if (!faculty.trim() || !program.trim()) {
        throw new Error("Fakultas dan program studi wajib dipilih");
      }
      setProfile({
        ...profile,
        faculty: faculty.trim(),
        program: program.trim(),
        timeZone: timeZone.trim() || "WITA (UTC+8)",
      });
      await updateInstitutionSettings({
        faculty: faculty.trim(),
        program: program.trim(),
        time_zone: timeZone.trim() || "WITA (UTC+8)",
      });
    },
    { successMessage: "Profil institusi disimpan", onSuccess: () => resetDirty() },
  );

  // Dropdown data
  const [fakulta, setFakultass] = useState<Fakultas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [prodis, setProdis] = useState<ProgramStudi[]>([]);
  const [loading, setLoading] = useState(true);

  // Cascade: fakulta → jurusan → prodi
  const selectedFakultaId = useMemo(() => {
    return fakulta.find((f) => f.name === faculty)?.id ?? null;
  }, [fakulta, faculty]);
  const filteredJurusan = useMemo(() => {
    if (!selectedFakultaId) return jurusanList;
    return jurusanList.filter((j) => j.fakultas_id === selectedFakultaId);
  }, [jurusanList, selectedFakultaId]);
  const filteredProdis = useMemo(() => {
    if (!selectedFakultaId) return prodis;
    const jrIds = new Set(filteredJurusan.map((j) => j.id));
    return prodis.filter((p) => p.jurusan_id && jrIds.has(p.jurusan_id));
  }, [prodis, filteredJurusan, selectedFakultaId]);

  useEffect(() => {
    if (!isAdmin) return;
    const ctrl = new AbortController();
    void Promise.all([
      getFakultas(false, ctrl.signal),
      getJurusan({ signal: ctrl.signal }),
      getProgramStudi({ signal: ctrl.signal }),
    ]).then(([fkList, jrList, psList]) => {
      if (ctrl.signal.aborted) return;
      setFakultass(fkList.filter(f => f.is_active));
      setJurusanList(jrList.filter(j => j.is_active));
      setProdis(psList.filter(p => p.is_active));
    }).catch(() => {
      if (!ctrl.signal.aborted) toast.error("Pilihan akademik gagal dimuat. Muat ulang halaman untuk mencoba lagi.");
    }).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [isAdmin]);

  function onFakultaChange(name: string) {
    setFaculty(name);
    // Reset prodi if it no longer belongs to the new fakulta's related prodis
    const newFkId = fakulta.find((f) => f.name === name)?.id ?? null;
    if (newFkId) {
      const relatedJrIds = new Set(jurusanList.filter((j) => j.fakultas_id === newFkId).map((j) => j.id));
      const relatedProdis = prodis.filter((p) => p.jurusan_id && relatedJrIds.has(p.jurusan_id));
      if (!relatedProdis.find((p) => p.name === program)) setProgram("");
    } else {
      setProgram("");
    }
  }




  if (!isAdmin) {
    return (
      <GlassCard>
        <SectionHeader
          number="01"
          title="Profil Institusi"
          sub="Identitas institusi, dipakai di header laporan & dokumen. Diatur oleh admin."
        />
        <div className="border-t border-hairline px-5 py-5">
          <p className="text-sm text-ink/60">
            Pengaturan profil institusi hanya dapat dilakukan oleh admin.
            Hubungi admin untuk perubahan.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader
        number="01"
        title="Profil Institusi"
        sub="Identitas program studi / perguruan tinggi, dipakai di header laporan & dokumen"
      />
      <div className="border-t border-hairline px-5 py-5 space-y-6">
        {isDirty && (
          <div className="border border-warning/40 bg-warning/[0.04] px-4 py-3 flex items-center justify-between gap-3 animate-fade-up">
            <p className="text-xs text-ink">
              <span className="font-semibold">Perubahan belum disimpan.</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setFaculty(profile.faculty);
                setProgram(profile.program);
                setTimeZone(profile.timeZone);
                resetDirty();
              }}
              className="editorial-ghost text-[11px]"
            >
              Buang perubahan
            </button>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <div>
              <label className="eyebrow block mb-2">Nama Universitas</label>
              <input
                value="Universitas Negeri Gorontalo"
                disabled
                className="editorial-input opacity-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Fakultas</label>
              <select
                value={faculty}
                onChange={(e) => onFakultaChange(e.target.value)}
                disabled={loading}
                className="editorial-input w-full bg-transparent"
              >
                <option value="">Pilih fakultas</option>
                {fakulta.map((f) => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="eyebrow block mb-2">Program Studi</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                disabled={loading}
                className="editorial-input w-full bg-transparent"
              >
                <option value="">Pilih program studi</option>
                {filteredProdis.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-2">Zona Waktu</label>
              <input
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                placeholder="WITA (UTC+8)"
                className="editorial-input"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-hairline pt-4 flex justify-end items-center gap-3">
          {(isSaving || isSaved) && (
            <div className="flex items-center gap-1.5 animate-fade-up">
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/55" />
                  <span className="text-xs text-ink/55">Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                  <span className="text-xs text-success">Tersimpan</span>
                </>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => doSave()}
            disabled={isSaving || loading}
            className="editorial-cta disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" />
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Campus tab with HereMaps click-to-pick ──────────────────────────────

interface EditableCampus extends CampusInput {
  id?: string;
}

function CampusTab() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditableCampus | null>(null);

  const { isSaving, isSaved, save: doSave } = useSaveState(
    async () => {
      if (!editing) return;
      if (!editing.name.trim()) throw new Error("Nama titik wajib diisi");
      if (
        Number.isNaN(editing.latitude) ||
        Number.isNaN(editing.longitude) ||
        editing.latitude < -90 ||
        editing.latitude > 90 ||
        editing.longitude < -180 ||
        editing.longitude > 180
      ) {
        throw new Error("Koordinat tidak valid");
      }
      const payload: CampusInput = {
        name: editing.name.trim(),
        latitude: Number(editing.latitude),
        longitude: Number(editing.longitude),
        radius_meters: Number(editing.radius_meters) || 200,
      };
      if (editing.id) {
        const updated = await updateCampus(editing.id, payload);
        setCampuses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createCampus(payload);
        setCampuses((prev) => [...prev, created]);
      }
    },
    { successMessage: "Titik kampus tersimpan", onSuccess: () => close() },
  );

  async function refresh() {
    setLoading(true);
    try {
      const list = await getCampuses();
      setCampuses(list);
    } catch (e) {
      toast.error(`Gagal memuat data kampus: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial data fetch on mount — setState calls are part of the data-sync
    // pattern (mirroring server state into local state), not a render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  function openNew() {
    setEditing({
      name: "",
      latitude: DEFAULT_CENTER.lat,
      longitude: DEFAULT_CENTER.lng,
      radius_meters: 200,
    });
    setOpen(true);
  }

  function openEdit(c: Campus) {
    setEditing({
      id: c.id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      radius_meters: c.radius_meters,
    });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
  }

  async function remove(c: Campus) {
    if (!confirm(`Hapus titik "${c.name}"?`)) return;
    try {
      await deleteCampus(c.id);
      setCampuses((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("Titik kampus dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function toggleActive(c: Campus, active: boolean) {
    try {
      const updated = await updateCampus(c.id, { is_active: active });
      setCampuses((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <GlassCard>
      <SectionHeader
        number="02"
        title="Titik Koordinat Kampus"
        sub="Atur titik GPS untuk deteksi lokasi mahasiswa, klik langsung pada peta"
        right={
          <Dialog
            open={open}
            onOpenChange={(o) => {
              if (!o) close();
              else if (!editing) openNew();
              else setOpen(true);
            }}
          >
            <DialogTrigger
              render={
                <button type="button" className="editorial-cta">
                  <Crosshair className="h-3.5 w-3.5" />
                  Tambah Titik
                </button>
              }
            />
            <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col p-0 rounded-none border border-hairline bg-paper">
              <DialogHeader className="px-5 pt-4 pb-3 shrink-0 border-b border-hairline">
                <DialogTitle className="text-base display-sans flex items-center gap-2 text-ink">
                  <Crosshair className="h-4 w-4 text-primary" />
                  {editing?.id ? "Edit Titik Kampus" : "Tambah Titik Kampus"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Klik pada peta untuk menentukan lokasi secara presisi, atau geser marker.
                  Koordinat akan terisi otomatis.
                </DialogDescription>
              </DialogHeader>
              <div className="px-5 py-5 overflow-y-auto space-y-4">
                {editing && (
                  <>
                    <div>
                      <label className="eyebrow block mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Titik Lokasi
                      </label>
                      <HereMapPicker
                        center={{ lat: editing.latitude, lng: editing.longitude }}
                        zoom={16}
                        marker={{ lat: editing.latitude, lng: editing.longitude }}
                        onMove={(lat, lng) =>
                          setEditing((prev) =>
                            prev ? { ...prev, latitude: lat, longitude: lng } : prev
                          )
                        }
                        className="h-96 border border-hairline"
                      />
                      <p className="text-[10px] text-ink/45 mt-1.5">
                        Tip: scroll untuk zoom, drag marker untuk fine-tune posisi.
                      </p>
                    </div>

                    <div>
                      <label className="eyebrow block mb-2">Nama Titik</label>
                      <input
                        value={editing.name}
                        onChange={(e) =>
                          setEditing((p) => (p ? { ...p, name: e.target.value } : p))
                        }
                        placeholder="Cth: Kampus 1 UNG"
                        className="editorial-input"
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="eyebrow block mb-2">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editing.latitude}
                          onChange={(e) =>
                            setEditing((p) =>
                              p ? { ...p, latitude: Number(e.target.value) } : p
                            )
                          }
                          className="editorial-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block mb-2">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editing.longitude}
                          onChange={(e) =>
                            setEditing((p) =>
                              p ? { ...p, longitude: Number(e.target.value) } : p
                            )
                          }
                          className="editorial-input font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="eyebrow">
                          Radius Deteksi: <span className="font-mono text-ink">{editing.radius_meters}m</span>
                        </label>
                        <span className="text-[10px] text-ink/55">
                          {Math.round(editing.radius_meters / 100) / 10} ha
                        </span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={2000}
                        step={50}
                        value={editing.radius_meters}
                        onChange={(e) =>
                          setEditing((p) =>
                            p ? { ...p, radius_meters: Number(e.target.value) } : p
                          )
                        }
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-ink/45 font-mono">
                        <span>50m</span>
                        <span>500m</span>
                        <span>1000m</span>
                        <span>2000m</span>
                      </div>
                    </div>

                    <div className="border border-hairline px-3 py-2 text-[11px] font-mono text-ink/55">
                      <span className="text-ink">●</span>{" "}
                      {editing.latitude.toFixed(6)}, {editing.longitude.toFixed(6)}
                      <span className="ml-2 text-ink/45">
                        (radius {editing.radius_meters}m)
                      </span>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="sticky bottom-0 shrink-0 px-5 py-3 gap-2 border-t border-hairline bg-paper">
                <button
                  type="button"
                  onClick={close}
                  disabled={isSaving}
                  className="editorial-ghost"
                >
                  Batal
                </button>
                {(isSaving || isSaved) && (
                  <div className="flex items-center gap-1.5 animate-fade-up">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/55" />
                        <span className="text-xs text-ink/55">Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                        <span className="text-xs text-success">Tersimpan</span>
                      </>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => doSave()}
                  className="editorial-cta"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {editing?.id ? "Simpan Perubahan" : "Tambah Titik"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="border-t border-hairline">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat data kampus…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="eyebrow-sm text-ink/45">Nama</TableHead>
                <TableHead className="eyebrow-sm text-ink/45">Latitude</TableHead>
                <TableHead className="eyebrow-sm text-ink/45">Longitude</TableHead>
                <TableHead className="eyebrow-sm text-ink/45 text-right">Radius (m)</TableHead>
                <TableHead className="eyebrow-sm text-ink/45">Status</TableHead>
                <TableHead className="eyebrow-sm text-ink/45 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campuses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-ink">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <div>{c.name}</div>
                        <div className="text-[10px] text-ink/45 font-mono tabular-nums">
                          {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{c.latitude.toFixed(6)}</TableCell>
                  <TableCell className="font-mono text-sm">{c.longitude.toFixed(6)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.radius_meters}m</TableCell>
                  <TableCell>
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(v) => void toggleActive(c, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="editorial-ghost text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(c)}
                        className="editorial-ghost text-[11px] text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {campuses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-ink/55">
                    Belum ada titik kampus. Klik &ldquo;Tambah Titik&rdquo; untuk membuat koordinat baru.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </GlassCard>
  );
}

