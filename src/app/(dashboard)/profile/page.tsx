"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Camera,
  Edit3,
  KeyRound,
  Mail,
  Phone,
  Save,
  Shield,
  User,
  X,
  Bell,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlassCard, SectionHeader, PageHeader } from "@/components/metrics";
import { useDirtyState } from "@/hooks/use-dirty-state";
import { useUserProfile, getInitials, type UserProfile } from "@/lib/user-profile";
import { useInstitution } from "@/lib/institution";
import { toast } from "sonner";
import { changePassword, getMyProfile, updateMyProfile, getLoginDevices, revokeLoginDevice, getFakultas, getJurusan, getProgramStudi, updateInstitutionSettings, type LoginDevice, type Fakultas, type Jurusan, type ProgramStudi } from "@/lib/api";

const initialNotifications = {
  trainingComplete: true,
  trainingFailed: true,
  newStudent: true,
  reportReady: false,
  systemUpdates: true,
};

// Fields the user can edit themselves. Username, role, and study_program are
// intentionally excluded — username/role are managed by admin; study_program
// is a student record (lives in Student table, not User). The form now mirrors
// the server's ProfileUpdate schema (full_name/phone/avatar_url/bio/email).

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useUserProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  // Round 26 — dirty detection for the Profile form. Compares current draft
  // against the server-known profile snapshot. Drives the top-of-page
  // "Perubahan belum disimpan" warning + "Buang perubahan" button.
  const profileDirty = useDirtyState(
    draft as unknown as Record<string, unknown>,
    profile as unknown as Record<string, unknown>,
  );

  // Round 30 audit (P2): unsaved-changes guard. If the user navigates
  // away (browser back, click a link, close tab) with unsaved profile
  // edits, prompt a native confirmation dialog. Without this, clicking
  // the browser back button after typing a new email would silently
  // discard the change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: BeforeUnloadEvent) => {
      if (profileDirty.isDirty) {
        e.preventDefault()
        // Modern browsers ignore the return string but require the
        // preventDefault call + a non-empty returnValue.
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [profileDirty.isDirty])
  const [devices, setDevices] = useState<LoginDevice[]>([]);
  const [devicesFetchedAt, setDevicesFetchedAt] = useState(0);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [notifications, setNotifications] = useState(initialNotifications);
  const [notifDraft, setNotifDraft] = useState(initialNotifications);
  const [editingNotif, setEditingNotif] = useState(false);

  // Academic dropdown state (dosen/mahasiswa can select their affiliation)
  const { profile: institution, setProfile: setInstitution } = useInstitution();
  const [fakultasList, setFakultasList] = useState<Fakultas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [selectedFakulta, setSelectedFakulta] = useState(institution.faculty || "");
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [selectedProdi, setSelectedProdi] = useState(institution.program || "");
  const [savingAkademik, setSavingAkademik] = useState(false);

  const isDosen = profile.role === "dosen";
  const isMahasiswa = profile.role === "mahasiswa";

  useEffect(() => {
    if (!isDosen && !isMahasiswa) return;
    (async () => {
      const [fk, jr, ps] = await Promise.all([getFakultas(), getJurusan(), getProgramStudi()]);
      setFakultasList(fk.filter((f) => f.is_active));
      setJurusanList(jr.filter((j) => j.is_active));
      setProdiList(ps.filter((p) => p.is_active));
    })();
  }, [isDosen, isMahasiswa]);

  // Filter jurusan by selected fakulta ID
  const selectedFakId = fakultasList.find((f) => f.name === selectedFakulta)?.id ?? "";
  const filteredJurusan = selectedFakId
    ? jurusanList.filter((j) => j.fakultas_id === selectedFakId)
    : [];

  // Filter prodi by selected jurusan ID
  const selectedJurId = filteredJurusan.find((j) => j.name === selectedJurusan)?.id ?? "";
  const filteredProdi = selectedJurId
    ? prodiList.filter((p) => p.jurusan_id === selectedJurId)
    : prodiList;

  // Map fakulta name → object for ID lookup


  async function saveAkademik() {
    if (!selectedFakulta) { toast.error("Fakultas wajib dipilih"); return; }
    if (!isDosen && !selectedProdi) { toast.error("Program studi wajib dipilih"); return; }
    setSavingAkademik(true);
    const updated = {
      ...institution,
      faculty: selectedFakulta,
      program: selectedProdi,
    };
    setInstitution(updated);
    await updateInstitutionSettings({ faculty: selectedFakulta, program: selectedProdi })
      .catch(() => toast.error("Gagal menyimpan"))
      .finally(() => setSavingAkademik(false));
    toast.success("Afisiensi akademik disimpan");
  }

  // Hydrate from server on mount — ensures email/full_name/phone reflect the
  // persisted User row, not a stale localStorage value. Without this, a profile
  // updated on another device would still show the old name until manual refresh.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const server = await getMyProfile();
        if (!alive) return;
        setProfile((prev) => ({
          ...prev,
          fullName: server.full_name || prev.fullName,
          email: server.email || prev.email,
          role: server.role || prev.role,
          phone: (server as { phone?: string }).phone || prev.phone,
          // Round 9: surface the user's persisted `jurusan` into both the
          // studyProgram slot (used by the header subtitle) and keep
          // `faculty` falling back to whatever the institution provider
          // already set, since the User model doesn't expose it yet.
          studyProgram: server.jurusan || prev.studyProgram,
        }));
      } catch {
        // fall back to localStorage
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load device list on mount (and after revokes). Server-side dedupe by
  // device_id means each row = one physical browser/app install.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await getLoginDevices();
        if (alive) { setDevices(list); setDevicesFetchedAt(Date.now()); }
      } catch {
        if (alive) setDevices([]);
      } finally {
        if (alive) setLoadingDevices(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleRevoke(deviceId: string) {
    setRevokingId(deviceId);
    try {
      await revokeLoginDevice(deviceId);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, is_current: false } : d))
      );
      toast.success("Perangkat dicabut");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencabut perangkat");
    } finally {
      setRevokingId(null);
    }
  }

  function relativeTime(iso: string | null): string {
    if (!iso) return "kosong";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "kosong";
    const diff = (devicesFetchedAt - d.getTime()) / 1000;
    if (diff < 60) return "baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
    return d.toLocaleDateString("id-ID");
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(profile);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  async function saveProfile() {
    if (!draft.fullName.trim() || !draft.email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({
        full_name: draft.fullName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      });
      // Round 26 audit (P1): build the next profile first, then atomically
      // push it into both the context and the local draft. Without the
      // setDraft call, the dirty-state stays "Perubahan belum disimpan"
      // for one render after save (because draft was the typed value
      // and profile is the saved value, they're unequal until the user
      // clicks Edit again). Mirrors the startEdit/cancelEdit pattern.
      const next: UserProfile = {
        ...profile,
        fullName: updated.full_name || profile.fullName,
        email: updated.email || profile.email,
        phone: (updated as { phone?: string }).phone || profile.phone,
      };
      setProfile(next);
      setDraft(next);
      setEditing(false);
      toast.success("Profil berhasil diperbarui");
      profileDirty.accept();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setSavingProfile(false);
    }
  }

  // Bug #2 — Camera button now opens a file picker. The chosen image is read as
  // base64 data URL and sent via avatar_url on save. Backend stores it as TEXT.
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("Ukuran foto maksimal 1 MB");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({ avatar_url: dataUrl });
      setProfile((prev) => ({ ...prev, avatarUrl: dataUrl, fullName: prev.fullName }));
      // The UserResponse model doesn't include avatar_url — pull from local optimistic update.
      // Future refactor: extend UserResponse to expose avatar_url.
      void updated;
      toast.success("Foto profil diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto");
    } finally {
      setSavingProfile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function savePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("Semua field kata sandi wajib diisi");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }
    try {
      await changePassword({ current_password: currentPwd, new_password: newPwd });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success("Kata sandi berhasil diubah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah kata sandi");
    }
  }

  function startEditNotif() {
    setNotifDraft(notifications);
    setEditingNotif(true);
  }

  function cancelEditNotif() {
    setNotifDraft(notifications);
    setEditingNotif(false);
  }

  function saveNotif() {
    setNotifications(notifDraft);
    setEditingNotif(false);
    toast.success("Preferensi notifikasi disimpan");
  }

  const initials = getInitials(profile.fullName);
  const avatarUrl = (profile as UserProfile & { avatarUrl?: string }).avatarUrl;

  // Form fields — username/role/studyProgram are read-only display only
  // (server doesn't allow self-edit of these; they're admin-managed).
  const fields: {
    key: keyof UserProfile;
    label: string;
    icon: React.ElementType;
    placeholder?: string;
    type?: string;
    editable: boolean;
    helper?: string;
  }[] = [
    { key: "fullName", label: "Nama Lengkap", icon: User, editable: true },
    {
      key: "username",
      label: "Username",
      icon: User,
      editable: false,
      helper: "Login ID, tidak dapat diubah sendiri. Hubungi admin.",
    },
    { key: "email", label: "Email", icon: Mail, type: "email", editable: true },
    { key: "phone", label: "No. HP", icon: Phone, type: "tel", editable: true },
    {
      key: "role",
      label: "Role",
      icon: Shield,
      editable: false,
      helper: "Peran akun, dikelola oleh admin sistem.",
    },
    {
      key: "studyProgram",
      label: "Program Studi",
      icon: GraduationCap,
      editable: false,
      helper: "Terikat pada data mahasiswa, hubungi admin atau dosen PA untuk perubahan.",
    },
  ];

  return (
    <div className="space-y-5 py-4">
      <PageHeader
        title="Profil Saya"
        connected={false}
        statusBadge={{ type: "completed", label: "Akun Aktif" }}
        downloadData={[
          {
            field: "Nama Lengkap",
            value: profile.fullName,
          },
          { field: "Username", value: profile.username },
          { field: "Email", value: profile.email },
          { field: "No. HP", value: profile.phone },
          { field: "Role", value: profile.role },
          { field: "Program Studi", value: profile.studyProgram },
          { field: "Fakultas", value: profile.faculty },
        ]}
        downloadColumns={[
          { key: "field", label: "Field" },
          { key: "value", label: "Value" },
        ]}
        downloadFilename="profil-saya"
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profil Saya
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
        </TabsList>

        {/* ─── Profile Tab ─── */}
        <TabsContent value="profile" className="space-y-4">
          {/* Avatar card */}
          <GlassCard>
            <SectionHeader
              number="01"
              title="Foto & Identitas"
              sub="Foto profil dan identitas akun Anda"
            />
            <div className="px-6 py-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    aria-label="Ganti foto"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={savingProfile}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-action text-white shadow-md hover:bg-red-900 disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-ink">{profile.fullName}</p>
                  <p className="text-sm text-ink/55">{profile.email}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="eyebrow-sm text-ink inline-flex items-center gap-1.5">
                      <Shield className="h-3 w-3" />
                      {profile.role || "—"}
                    </span>
                    <span className="eyebrow-sm text-ink/55 inline-flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      {profile.studyProgram || profile.faculty || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Form card */}
          <GlassCard>
            <SectionHeader
              number="02"
              title="Informasi Akun"
              sub="Data pribadi dan kontak Anda"
              right={
                !editing ? (
                  <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Profil
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={savingProfile} className="gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Batal
                    </Button>
                    <Button size="sm" onClick={saveProfile} disabled={savingProfile} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                )
              }
            />
            <div className="px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map(({ key, label, icon: Icon, type = "text", placeholder, editable, helper }) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`field-${key}`} className="text-xs">
                      {label}
                      {!editable && (
                        <span className="ml-1 text-[10px] text-ink/45 font-normal">(read-only)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40 pointer-events-none" />
                      <Input
                        id={`field-${key}`}
                        type={type}
                        placeholder={placeholder}
                        value={editing ? draft[key] : profile[key]}
                        onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                        disabled={!editing || !editable}
                        className="pl-9 disabled:opacity-100 disabled:cursor-default"
                      />
                    </div>
                    {helper && (
                      <p className="text-[10px] text-ink/45 mt-0.5">{helper}</p>
                    )}
                  </div>
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  {/* Round 9: faculty isn't yet a column on User; show
                      studyProgram here as the read-only affiliation chip so
                      the form always reflects real account data instead of
                      a static placeholder. */}
                  <Label className="text-xs">
                    Fakultas
                    <span className="ml-1 text-[10px] text-ink/45 font-normal">(read-only)</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40 pointer-events-none" />
                    <Input
                      value={profile.studyProgram || profile.faculty || ""}
                      onChange={() => undefined}
                      readOnly
                      placeholder="kosong"
                      className="pl-9 disabled:opacity-100 disabled:cursor-default"
                    />
                  </div>
                  <p className="text-[10px] text-ink/45 mt-0.5">
                    Diturunkan dari Program Studi / Jurusan yang terdaftar pada akun Anda.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Academic affiliation — for dosen/mahasiswa */}
          {(isDosen || isMahasiswa) && (
            <GlassCard>
              <SectionHeader
                number="03"
                title="Afisiensi Akademik"
                sub={isDosen
                  ? "Pilih fakultas dan jurusan tempat Anda mengajar. Program studi opsional."
                  : "Pilih fakultas, jurusan, dan program studi Anda."}
              />
              <div className="border-t border-hairline px-5 py-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fakultas</Label>
                    <select
                      value={selectedFakulta}
                      onChange={(e) => {
                        setSelectedFakulta(e.target.value);
                        setSelectedJurusan("");
                        setSelectedProdi("");
                      }}
                      className="editorial-input w-full bg-transparent"
                    >
                      <option value="">Pilih fakultas</option>
                      {fakultasList.map((f) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jurusan</Label>
                    <select
                      value={selectedJurusan}
                      onChange={(e) => {
                        setSelectedJurusan(e.target.value);
                        setSelectedProdi("");
                      }}
                      disabled={!selectedFakulta}
                      className="editorial-input w-full bg-transparent disabled:opacity-50"
                    >
                      <option value="">Pilih jurusan</option>
                      {filteredJurusan.map((j) => (
                        <option key={j.id} value={j.name}>{j.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {!isDosen && (
                  <div className="space-y-1.5 md:max-w-xs">
                    <Label className="text-xs">Program Studi</Label>
                    <select
                      value={selectedProdi}
                      onChange={(e) => setSelectedProdi(e.target.value)}
                      disabled={!selectedJurusan && !selectedFakulta}
                      className="editorial-input w-full bg-transparent disabled:opacity-50"
                    >
                      <option value="">Pilih program studi</option>
                      {filteredProdi.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {isDosen && (
                  <p className="text-xs text-ink/55">
                    Dosen mengajarkan per jurusan, tidak wajib memilih program studi.
                  </p>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={saveAkademik}
                    disabled={savingAkademik}
                    className="editorial-cta disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingAkademik ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* ─── Security Tab ─── */}
        <TabsContent value="security" className="space-y-4">
          <GlassCard>
            <SectionHeader
              number="03"
              title="Ubah Kata Sandi"
              sub="Pastikan kata sandi baru minimal 8 karakter dan kombinasi huruf besar, kecil, dan angka."
            />
            <div className="px-6 py-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pwd" className="text-xs">Kata Sandi Saat Ini</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40 pointer-events-none" />
                  <Input
                    id="current-pwd"
                    type="password"
                    placeholder="••••••••"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pwd" className="text-xs">Kata Sandi Baru</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40 pointer-events-none" />
                    <Input
                      id="new-pwd"
                      type="password"
                      placeholder="Minimal 8 karakter"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pwd" className="text-xs">Konfirmasi Kata Sandi Baru</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40 pointer-events-none" />
                    <Input
                      id="confirm-pwd"
                      type="password"
                      placeholder="Ulangi kata sandi baru"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={savePassword} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Simpan Kata Sandi
                </Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader
              number="04"
              title="Sesi Login"
              sub="Daftar perangkat yang pernah login ke akun Anda. Cabut untuk keluar dari perangkat yang bukan milik Anda."
            />
            <div className="px-6 py-6 space-y-4">
              {loadingDevices ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-16 border divider-soft bg-ink/[0.015] animate-pulse" />
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <div className="border divider-soft p-4 text-center bg-ink/[0.015]">
                  <p className="text-xs text-ink/55">Belum ada perangkat tercatat.</p>
                </div>
              ) : (
                <ul className="border-t divider-soft rounded-sm overflow-hidden">
                  {devices.map((d) => (
                    <li
                      key={d.id}
                      className="border-b divider-soft last:border-b-0 py-4 px-4 flex items-start gap-4 row-hover"
                    >
                      {/* Index marker */}
                      <span className="eyebrow-sm text-ink/45 shrink-0 pt-0.5 w-6 tabular-nums">
                        {String(devices.indexOf(d) + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-ink truncate">
                            {d.device_name || d.user_agent.slice(0, 60) || "Perangkat tidak dikenal"}
                          </span>
                          {d.is_current && (
                            <span className="eyebrow-sm text-success inline-flex items-center gap-1.5 shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" />
                              Perangkat ini
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink/55 font-mono mt-1 truncate">
                          {d.user_agent || "kosong"}
                        </p>
                        <p className="text-[10px] text-ink/45 mt-1.5">
                          Terakhir login {relativeTime(d.last_seen)}
                          {d.first_seen && (
                            <>
                              {" · "}Pertama terlihat {relativeTime(d.first_seen)}
                            </>
                          )}
                        </p>
                      </div>

                      {!d.is_current && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(d.id)}
                          disabled={revokingId === d.id}
                          className="editorial-ghost shrink-0 text-[11px] disabled:opacity-50"
                        >
                          {revokingId === d.id ? "Mencabut…" : "Cabut"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-[10px] text-ink/45">
                Logout dari semua perangkat akan menghapus semua token refresh Anda.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    const { logout } = await import("@/lib/api");
                    await logout();
                    router.replace("/login");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Logout gagal");
                  }
                }}
              >
                Logout dari semua perangkat
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ─── Notifications Tab ─── */}
        <TabsContent value="notifications" className="space-y-4">
          <GlassCard>
            <SectionHeader
              number="05"
              title="Preferensi Notifikasi"
              sub="Pilih event yang ingin Anda terima notifikasinya"
              right={
                !editingNotif ? (
                  <Button size="sm" variant="outline" onClick={startEditNotif} className="gap-1.5">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={cancelEditNotif} className="gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Batal
                    </Button>
                    <Button size="sm" onClick={saveNotif} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      Simpan
                    </Button>
                  </div>
                )
              }
            />
            <div className="px-6 py-6 space-y-3">
              {[
                { key: "trainingComplete", label: "Training model selesai", desc: "Notifikasi saat training PCA + K-Means berhasil" },
                { key: "trainingFailed", label: "Training model gagal", desc: "Alert jika pipeline training error" },
                { key: "newStudent", label: "Mahasiswa baru terdaftar", desc: "Saat ada mahasiswa baru masuk sistem" },
                { key: "reportReady", label: "Laporan mingguan siap", desc: "Laporan otomatis tiap Senin pagi" },
                { key: "systemUpdates", label: "Update sistem", desc: "Info maintenance & fitur baru" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-ink/40">{desc}</p>
                  </div>
                  <Switch
                    checked={editingNotif ? notifDraft[key as keyof typeof notifDraft] : notifications[key as keyof typeof notifications]}
                    onCheckedChange={(v) => setNotifDraft((p) => ({ ...p, [key]: v }))}
                    disabled={!editingNotif}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
