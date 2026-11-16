const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FetchOptions extends RequestInit {
  /** Skip the /login redirect when refresh fails (for public pages). */
  noRedirect?: boolean;
}

// ─── Current User ───────────────────────────────────────────────────────────

export interface CurrentUser {
  sub: string;
  email?: string;
  role: string;
  full_name?: string;
  jabatan?: string;
  jurusan?: string;
  nip?: string;
}

/**
 * Fetch current user from the server using the HttpOnly cookie.
 * Returns null if not authenticated (no valid cookie).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (typeof window === "undefined") return null;
  try {
    return await apiFetch<CurrentUser>("/api/auth/me", { noRedirect: true });
  } catch {
    return null;
  }
}

// ─── Token Refresh ──────────────────────────────────────────────────────────

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Attempt token refresh using the HttpOnly refresh cookie.
 * Returns the new access token on success, null on failure.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Sesi belum dapat diperbarui. Coba lagi.");
      // Extract the new access token from the response body so the caller
      // can update the Authorization header on the retry request.
      const data = await res.json();
      if (typeof data.access_token !== "string") throw new Error("Respons sesi tidak valid. Coba lagi.");
      return data.access_token;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ─── Core API Fetch ─────────────────────────────────────────────────────────

let activeJurusanId: string | null = null;
let activeProgramStudiId: string | null = null;

export function setAcademicScopeHeaders(jurusanId: string | null, prodiId: string | null) {
  activeJurusanId = jurusanId;
  activeProgramStudiId = prodiId;
}

export function getAcademicScopeHeaders(): { jurusanId: string | null; prodiId: string | null } {
  return { jurusanId: activeJurusanId, prodiId: activeProgramStudiId };
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const fetchOpts: RequestInit = {
    ...options,
    credentials: "include",
  };

  // Accept AbortSignal under the `signal` key (camelCase) so callers can
  // cancel stale requests — e.g. a fast-typing search fires N requests in
  // quick succession and only the latest should land. Without this, a slow
  // first response arriving after a fast second one would overwrite the
  // fresh data with stale results.
  const sig = (options as { signal?: AbortSignal }).signal;
  if (sig) fetchOpts.signal = sig;

  const scopeHeaders: Record<string, string> = {};
  const isMetaPath = path.startsWith("/api/jurusan") || path.startsWith("/api/fakultas") || path.startsWith("/api/auth");
  if (!isMetaPath) {
    if (activeJurusanId && activeJurusanId !== "all") {
      scopeHeaders["x-jurusan-id"] = activeJurusanId;
    }
    if (activeProgramStudiId && activeProgramStudiId !== "all") {
      scopeHeaders["x-program-studi-id"] = activeProgramStudiId;
    }
  }

  const explicitHeaders = (options.headers as Record<string, string>) ?? {};
  fetchOpts.headers = {
    ...(options.method !== "GET" && options.method !== "HEAD" ? { "Content-Type": "application/json" } : {}),
    ...scopeHeaders,
    ...explicitHeaders,
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, fetchOpts);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Surface as a typed error so callers can ignore without spamming
      // the console. Toast handlers shouldn't fire on cancellation.
      throw new AbortError();
    }
    throw new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // If we hit 401 and this is not an auth-mutating endpoint, try refreshing.
  // Includes /api/auth/me — when the access JWT expires (30-minute lifetime
  // since round 10), AuthGuard's `/api/auth/me` returns 401; trying the
  // refresh cookie first lets the user stay logged in instead of being
  // bounced to /login.
  const isAuthMutatingPath =
    path === "/api/auth/login" ||
    path === "/api/auth/refresh" ||
    path === "/api/auth/logout" ||
    path === "/api/auth/devices" ||
    path.startsWith("/api/auth/devices/");
  if (res.status === 401 && !isAuthMutatingPath) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      // Update the Authorization header so the retry uses the fresh token.
      // Without this, the old expired token in the header would be read by
      // the server (it checks Authorization before the cookie), causing
      // another 401 and an infinite refresh loop.
      const headers = (fetchOpts.headers as Record<string, string>) ?? {};
      headers["Authorization"] = `Bearer ${newAccessToken}`;
      fetchOpts.headers = headers;
      try {
        res = await fetch(`${API_BASE}${path}`, fetchOpts);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw new AbortError();
        throw new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // Refresh failed — redirect to /login unless noRedirect is set.
      // Used by public pages (landing view) that fetch auth-gated data
      // for decorative purposes (e.g. cluster K count). In that case
      // we silently fall back to the catch block's own error handling.
      if (typeof window !== "undefined" && !(options as { noRedirect?: boolean }).noRedirect) {
        // Expired authentication needs a full navigation to discard protected client state.
        window.location.replace(new URL("/login", window.location.origin).href);
      }
      throw new RedirectError();
    }
  }

  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const err = await res.json();
      if (typeof err === "object" && err !== null && "detail" in err) {
        if (typeof err.detail === "string") {
          detail = err.detail;
        } else if (Array.isArray(err.detail)) {
          detail = (err.detail as Array<Record<string, unknown>>)
            .map((e) => e.msg || JSON.stringify(e))
            .join("; ");
        } else if (err.detail && typeof err.detail === "object") {
          const inner = err.detail as Record<string, unknown>;
          detail = typeof inner.msg === "string"
            ? inner.msg
            : typeof inner.message === "string"
            ? inner.message
            : JSON.stringify(err.detail);
        }
      } else if (typeof err === "string") {
        detail = err;
      }
    } catch {
      detail = res.statusText || `HTTP ${res.status}`;
    }
    throw new Error(detail);
  }
  return (res.status === 204 ? undefined : res.json()) as T;
}

/** Thrown when a fetch is canceled via AbortSignal — callers can ignore. */
export class AbortError extends Error {
  constructor() {
    super("Request aborted");
    this.name = "AbortError";
  }
}

/**
 * Thrown when an API call returns 401 and refresh failed — we then redirect
 * to /login. Callers should suppress their error toast because the browser
 * is about to navigate; without this, users see "Gagal memuat …" briefly
 * before the page changes.
 */
export class RedirectError extends Error {
  constructor() {
    super("Redirecting to login");
    this.name = "RedirectError";
  }
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  // Compute a deterministic device fingerprint from the browser's UA + screen
  // size + locale. The server uses this to dedupe devices per (user,
  // device_id) so the same browser always lands on the same row.
  const device_id = await computeDeviceId();
  const device_name = parseDeviceName(navigator.userAgent);
  const result = await apiFetch<{ access_token: string; refresh_token?: string; token_type: string }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        device_id,
        device_name,
        user_agent: navigator.userAgent.slice(0, 500),
      }),
    }
  );
  // Round 29 audit P1 #11: previously stored the JWT in sessionStorage
  // so the WebSocket client could read it and pass as `?token=`.
  // After P0 #2 (Round 29) the WebSocket auth reads the HttpOnly
  // `access_token` cookie on the upgrade request — no JS-readable
  // token needed. Stop writing to sessionStorage. Any other code
  // that still reads from sessionStorage via getAccessToken() will
  // get an empty string (the auth flow is cookie-only now).
  clearUserCache();
  return result;
}

function parseDeviceName(ua: string): string {
  let browser = "Browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Chrome/") && ua.includes("Safari/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";
  let os = "";
  if (ua.includes("Windows")) os = " di Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = " di macOS";
  else if (ua.includes("Android")) os = " di Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = " di iOS";
  else if (ua.includes("Linux")) os = " di Linux";
  return `${browser}${os}`;
}

async function computeDeviceId(): Promise<string> {
  const parts = [
    navigator.userAgent,
    `${window.screen.width}x${window.screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  ].join("|");
  // SubtleCrypto -> SHA-256 -> first 32 hex chars (matches server-side row width).
  try {
    const buf = new TextEncoder().encode(parts);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    // Old browsers without SubtleCrypto — fall back to a plain slice of UA
    // (still produces a stable, dedupable key per browser install).
    return parts.slice(0, 32);
  }
}

export async function logout() {
  await apiFetch("/api/auth/logout", { method: "POST" });
  clearUserCache();
}

export function clearUserCache() {
  if (typeof window === "undefined") return;
  for (const key of ["user_profile_v1", "institution_profile_v1", "notification_prefs", "command-palette-recents"]) {
    try { window.localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
  }
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
}

// ─── Models / Data Mining ────────────────────────────────────────────────────

export async function getModelHistory(options?: FetchOptions) {
  return apiFetch<ModelVersion[]>("/api/models/history", options);
}

export async function getLatestResult() {
  return apiFetch<LatestResult>("/api/models/results/latest");
}

export async function updateModelConfig(config: {
  pca_n_components: number;
  kmeans_n_clusters: number;
  cluster_labels?: Record<string, string>;
}): Promise<{ message: string; config: { pca_n_components: number; kmeans_n_clusters: number } }> {
  return apiFetch("/api/models/config", {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

export async function triggerTraining(config: {
  pca_n_components: number;
  kmeans_n_clusters: number;
}) {
  return apiFetch<{ message: string; version_number: number }>("/api/models/train", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function activateModel(modelId: string): Promise<void> {
  return apiFetch<void>(`/api/models/${modelId}/activate`, { method: "PATCH" });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getReport(params: {
  period?: string;
  start_date: string;
  end_date: string;
  cluster?: number;
  signal?: AbortSignal;
}) {
  const { period, start_date, end_date, cluster, signal } = params;
  const qs = new URLSearchParams({
    period: period ?? "",
    start_date,
    end_date,
    ...(cluster != null ? { cluster: cluster.toString() } : {}),
  }).toString();
  return apiFetch<ReportResponse>(`/api/reports?${qs}`, { signal });
}

export interface ScreenTimeTrend {
  date: string;
  label: string;
  log_count: number;
  avg_duration_min: number;
  total_duration_min: number;
}

export interface ClusterTrend {
  start_date?: string;
  end_date?: string;
  avg_distraction_score: number | null;
  cluster_counts: Record<string, number>;
  date?: string;
  label: string;
  Rendah: number;
  Sedang: number;
  Tinggi: number;
  total: number;
}

export interface DashboardSummary {
  total_registered: number;
  active_students_week: number;
  pending_students: number;
  app_logs_week: number;
  seed_logs_week: number;
  avg_screen_time_today_min: number;
  avg_unlock_count_today: number;
  avg_social_media_time_today_min: number;
  avg_game_time_today_min: number;
  date: string;
}

export async function getScreenTimeTrends(days: number = 7, signal?: AbortSignal): Promise<{ trends: ScreenTimeTrend[] }> {
  return apiFetch<{ trends: ScreenTimeTrend[] }>(`/api/reports/screen-time?days=${days}`, { signal });
}

export async function getClusterTrends(
  period: "daily" | "weekly" | "monthly" = "weekly",
  weeks: number = 4,
  signal?: AbortSignal
): Promise<{ trends: ClusterTrend[] }> {
  return apiFetch<{ trends: ClusterTrend[] }>(
    `/api/reports/cluster-trends?period=${period}&weeks=${weeks}`,
    { signal }
  );
}

export async function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/reports/summary", { signal });
}

// ─── Students ────────────────────────────────────────────────────────────────

export interface StudentListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Student[];
  cluster_distribution: Record<string, number>;
  active_model_version: number | null;
}

export async function getStudents(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  cluster_filter?: string;
  program_studi_id?: string;
  advisor_id?: string;
}, signal?: AbortSignal): Promise<StudentListResponse> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set("page", String(params.page));
  if (params?.page_size !== undefined) sp.set("page_size", String(params.page_size));
  if (params?.search) sp.set("search", params.search);
  if (params?.cluster_filter) sp.set("cluster_filter", params.cluster_filter);
  if (params?.program_studi_id) sp.set("program_studi_id", params.program_studi_id);
  if (params?.advisor_id) sp.set("advisor_id", params.advisor_id);
  const qs = sp.toString();
  return apiFetch<StudentListResponse>(`/api/students${qs ? "?" + qs : ""}`, { signal });
}

export interface StudentInput {
  nim: string;
  full_name: string;
  program_studi: string;
  semester: number;
  advisor_id?: string | null;
  create_user_account?: boolean;
  email?: string | null;
  initial_password?: string | null;
}

export async function createStudent(input: StudentInput) {
  return apiFetch<Student>("/api/students", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface AdvisorOption {
  id: string;
  full_name: string;
  username: string;
  role: string;
}

export async function getAdvisors(signal?: AbortSignal): Promise<AdvisorOption[]> {
  return apiFetch<AdvisorOption[]>("/api/users/advisors", { signal });
}

// ─── Schedule Requests ─────────────────────────────────────────────────────────

export interface ScheduleRequest {
  id: string;
  requester_id: string;
  student_id: string | null;
  request_type: string;
  description: string;
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  subject_id: string | null;
  lecturer_id: string | null;
  subject_name_raw: string | null;
  lecturer_name_raw: string | null;
  campus_id: string | null;
  subject_name: string | null;
  lecturer_name: string | null;
  student_name: string | null;
}

export interface ScheduleRequestInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string | null;
  subject_id?: string | null;
  lecturer_id?: string | null;
  subject_name_raw?: string | null;
  lecturer_name_raw?: string | null;
  campus_id?: string | null;
  description?: string;
}

export async function createScheduleRequest(
  input: ScheduleRequestInput,
  signal?: AbortSignal
): Promise<ScheduleRequest> {
  return apiFetch<ScheduleRequest>("/api/schedule-requests", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export async function getMyScheduleRequests(signal?: AbortSignal): Promise<{
  requests: ScheduleRequest[];
  total: number;
}> {
  return apiFetch<{ requests: ScheduleRequest[]; total: number }>(
    "/api/schedule-requests/mine",
    { signal }
  );
}

// ─── Campuses ────────────────────────────────────────────────────────────────

export interface Campus {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

export interface CampusInput {
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export async function getCampuses() {
  return apiFetch<Campus[]>("/api/campuses");
}

export async function createCampus(input: CampusInput) {
  return apiFetch<Campus>("/api/campuses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCampus(id: string, data: Partial<CampusInput & { is_active: boolean }>) {
  return apiFetch<Campus>(`/api/campuses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCampus(id: string) {
  return apiFetch<void>(`/api/campuses/${id}`, {
    method: "DELETE",
  });
}

// ─── Program Studi (master list) ──────────────────────────────────────────

export interface ProgramStudi {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string | null;
  // Round 8: nullable FK to a Jurusan (department)
  jurusan_id?: string | null;
}

export interface ProgramStudiInput {
  code: string;
  name: string;
  description?: string;
  // Round 8: optional parent jurusan — undefined/null is allowed for legacy rows
  jurusan_id?: string | null;
}

export async function getProgramStudi(
  opts: { includeInactive?: boolean; jurusanId?: string; signal?: AbortSignal } = {}
): Promise<ProgramStudi[]> {
  const params = new URLSearchParams();
  if (opts.includeInactive) params.set("include_inactive", "true");
  if (opts.jurusanId) params.set("jurusan_id", opts.jurusanId);
  const qs = params.toString();
  return apiFetch<ProgramStudi[]>(
    `/api/program-studi${qs ? `?${qs}` : ""}`,
    { signal: opts.signal }
  );
}

export async function createProgramStudi(input: ProgramStudiInput): Promise<ProgramStudi> {
  return apiFetch<ProgramStudi>("/api/program-studi", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProgramStudi(
  id: string,
  data: Partial<ProgramStudiInput & { is_active: boolean }>
): Promise<ProgramStudi> {
  return apiFetch<ProgramStudi>(`/api/program-studi/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProgramStudi(id: string): Promise<void> {
  return apiFetch<void>(`/api/program-studi/${id}`, {
    method: "DELETE",
  });
}

// ─── Fakultas (top-level academic faculty) ──────────────────────────────────

export interface Fakultas {
  id: string;
  code: string;
  name: string;
  description?: string;
  campus_id?: string | null;
  is_active: boolean;
  created_at?: string | null;
}

export interface FakultasInput {
  code: string;
  name: string;
  description?: string;
  campus_id?: string | null;
}

export async function getFakultas(
  includeInactive = false,
  signal?: AbortSignal
): Promise<Fakultas[]> {
  return apiFetch<Fakultas[]>(
    `/api/fakultas${includeInactive ? "?include_inactive=true" : ""}`,
    { signal }
  );
}

export async function createFakultas(input: FakultasInput): Promise<Fakultas> {
  return apiFetch<Fakultas>("/api/fakultas", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateFakultas(
  id: string,
  data: Partial<FakultasInput & { is_active: boolean }>
): Promise<Fakultas> {
  return apiFetch<Fakultas>(`/api/fakultas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFakultas(id: string): Promise<void> {
  return apiFetch<void>(`/api/fakultas/${id}`, {
    method: "DELETE",
  });
}

// ─── Jurusan (department — sits inside a Fakultas) ──────────────────────────

export interface Jurusan {
  id: string;
  code: string;
  name: string;
  description?: string;
  fakultas_id: string;
  is_active: boolean;
  created_at?: string | null;
}

export interface JurusanInput {
  code: string;
  name: string;
  description?: string;
  fakultas_id: string;
}

export async function getJurusan(
  opts: { fakultasId?: string; includeInactive?: boolean; signal?: AbortSignal } = {}
): Promise<Jurusan[]> {
  const params = new URLSearchParams();
  if (opts.fakultasId) params.set("fakultas_id", opts.fakultasId);
  if (opts.includeInactive) params.set("include_inactive", "true");
  const qs = params.toString();
  return apiFetch<Jurusan[]>(
    `/api/jurusan${qs ? `?${qs}` : ""}`,
    { signal: opts.signal }
  );
}

export async function createJurusan(input: JurusanInput): Promise<Jurusan> {
  return apiFetch<Jurusan>("/api/jurusan", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateJurusan(
  id: string,
  data: Partial<JurusanInput & { is_active: boolean }>
): Promise<Jurusan> {
  return apiFetch<Jurusan>(`/api/jurusan/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteJurusan(id: string): Promise<void> {
  return apiFetch<void>(`/api/jurusan/${id}`, {
    method: "DELETE",
  });
}

// ─── Mata Kuliah (course master list) ──────────────────────────────────────

export interface MataKuliah {
  id: string;
  code: string;
  name: string;
  sks: number;
  semester: number;
  program_studi_id: string | null;
  dosen_id: string | null;
  // Required — lokasi kampus untuk geofence attendance detection di Android.
  campus_id: string | null;
  campus_name: string | null;
  description: string;
  is_active: boolean;
  created_at: string | null;
}

export interface MataKuliahInput {
  code: string;
  name: string;
  sks?: number;
  semester?: number;
  program_studi_id?: string | null;
  dosen_id?: string | null;
  // Required: lokasi kampus mata kuliah.
  campus_id: string;
  description?: string;
}

export async function getMataKuliah(
  params: { program_studi_id?: string; include_inactive?: boolean } = {},
  signal?: AbortSignal
): Promise<MataKuliah[]> {
  const sp = new URLSearchParams();
  if (params.program_studi_id) sp.set("program_studi_id", params.program_studi_id);
  if (params.include_inactive) sp.set("include_inactive", "true");
  const qs = sp.toString();
  return apiFetch<MataKuliah[]>(`/api/mata-kuliah${qs ? "?" + qs : ""}`, { signal });
}

export async function createMataKuliah(input: MataKuliahInput, signal?: AbortSignal): Promise<MataKuliah> {
  return apiFetch<MataKuliah>("/api/mata-kuliah", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export async function updateMataKuliah(
  id: string,
  data: Partial<MataKuliahInput & { is_active: boolean }>,
  signal?: AbortSignal
): Promise<MataKuliah> {
  return apiFetch<MataKuliah>(`/api/mata-kuliah/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    signal,
  });
}

export async function deleteMataKuliah(id: string, signal?: AbortSignal): Promise<void> {
  return apiFetch<void>(`/api/mata-kuliah/${id}`, {
    method: "DELETE",
    signal,
  });
}

// ─── Jadwal Mata Kuliah (course schedule) ──────────────────────────────────

export interface JadwalMataKuliah {
  id: string;
  mata_kuliah_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  is_active: boolean;
  created_at: string | null;
}

export interface JadwalMataKuliahInput {
  mata_kuliah_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
}

export async function getJadwalMataKuliah(
  params: { mata_kuliah_id?: string; include_inactive?: boolean } = {},
  signal?: AbortSignal
): Promise<JadwalMataKuliah[]> {
  const sp = new URLSearchParams();
  if (params.mata_kuliah_id) sp.set("mata_kuliah_id", params.mata_kuliah_id);
  if (params.include_inactive) sp.set("include_inactive", "true");
  const qs = sp.toString();
  return apiFetch<JadwalMataKuliah[]>(`/api/jadwal-mata-kuliah${qs ? "?" + qs : ""}`, { signal });
}

export async function createJadwalMataKuliah(
  input: JadwalMataKuliahInput,
  signal?: AbortSignal
): Promise<JadwalMataKuliah> {
  return apiFetch<JadwalMataKuliah>("/api/jadwal-mata-kuliah", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export async function updateJadwalMataKuliah(
  id: string,
  data: Partial<JadwalMataKuliahInput & { is_active: boolean }>,
  signal?: AbortSignal
): Promise<JadwalMataKuliah> {
  return apiFetch<JadwalMataKuliah>(`/api/jadwal-mata-kuliah/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    signal,
  });
}

export async function deleteJadwalMataKuliah(id: string, signal?: AbortSignal): Promise<void> {
  return apiFetch<void>(`/api/jadwal-mata-kuliah/${id}`, {
    method: "DELETE",
    signal,
  });
}

// ─── Request Akademik (course / schedule requests) ─────────────────────────

export type RequestAkademikType = "course" | "schedule_slot";
export type RequestAkademikStatus = "pending" | "approved" | "rejected";

export interface RequestAkademik {
  id: string;
  type: RequestAkademikType;
  name: string;
  description: string;
  payload: string;
  target_id: string | null;
  requested_by_id: string | null;
  status: RequestAkademikStatus;
  reviewed_by_id: string | null;
  review_notes: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface RequestAkademikInput {
  type: RequestAkademikType;
  name: string;
  description?: string;
  payload?: string;
  target_id?: string | null;
}

export async function getRequestAkademik(
  params: { status?: RequestAkademikStatus } = {},
  signal?: AbortSignal
): Promise<RequestAkademik[]> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  const qs = sp.toString();
  return apiFetch<RequestAkademik[]>(`/api/request-akademik${qs ? "?" + qs : ""}`, { signal });
}

export async function createRequestAkademik(input: RequestAkademikInput, signal?: AbortSignal): Promise<RequestAkademik> {
  return apiFetch<RequestAkademik>("/api/request-akademik", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export async function reviewRequestAkademik(
  id: string,
  status: "approved" | "rejected",
  review_notes: string = "",
  signal?: AbortSignal
): Promise<RequestAkademik> {
  return apiFetch<RequestAkademik>(`/api/request-akademik/${id}/review`, {
    method: "PUT",
    body: JSON.stringify({ status, review_notes }),
    signal,
  });
}

export async function deleteRequestAkademik(id: string, signal?: AbortSignal): Promise<void> {
  return apiFetch<void>(`/api/request-akademik/${id}`, {
    method: "DELETE",
    signal,
  });
}

// ─── Login devices ────────────────────────────────────────────────────────

export interface LoginDevice {
  id: string;
  device_id: string;
  device_name: string;
  user_agent: string;
  first_seen: string | null;
  last_seen: string | null;
  is_current: boolean;
}

export async function getLoginDevices(): Promise<LoginDevice[]> {
  return apiFetch<LoginDevice[]>("/api/auth/devices");
}

export async function revokeLoginDevice(id: string): Promise<void> {
  return apiFetch<void>(`/api/auth/devices/${id}`, {
    method: "DELETE",
  });
}

// ─── Logs ───────────────────────────────────────────────────────────────────

export async function getLogs() {
  return apiFetch<LogBatch[]>("/api/logs/sync-status");
}

export async function postLogs(logs: AppLogInput[]) {
  return apiFetch("/api/logs/batch", {
    method: "POST",
    body: JSON.stringify(logs),
  });
}

// ─── WebSocket real-time stream ────────────────────────────────────────────────
//
// Auth: browser auto-sends the HttpOnly `access_token` cookie on the
// WebSocket upgrade request. The server (`routers/logs.py logs_stream_ws`)
// reads it via `websocket.cookies.get("access_token")` — no token in URL.
//
// Round 29 audit P0 #2: removed the `?token=${jwt}` query-param pattern.
// Round 29 audit P1 #11: removed the `ws_access_token` sessionStorage
// pattern (and the dead `getAccessToken` helper). The browser's
// HttpOnly cookie is sufficient for both HTTP and WebSocket auth.
//
// Message format: JSON LogStreamEvent per frame.

export function subscribeLogsStreamWebSocket(
  onMessage: (data: LogStreamEvent) => void,
): () => void {
  let socket: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const controller = new AbortController();
  const base = new URL(API_BASE || window.location.origin, window.location.origin);
  const endpoint = new URL("/api/logs/stream/ws", base);
  endpoint.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  const relay = process.env.NEXT_PUBLIC_WS_RELAY_URL;
  // Host-only auth cookies cannot authenticate a relay on another hostname.
  if (relay) {
    const candidate = new URL(relay, base);
    if (candidate.hostname === base.hostname && candidate.protocol === endpoint.protocol) {
      endpoint.href = candidate.href;
    }
  }

  function retry() {
    if (closed || attempt >= 10) return;
    reconnectTimer = setTimeout(connect, Math.min(30_000, 500 * 2 ** attempt++));
  }

  async function connect() {
    if (closed) return;
    // Rejected handshakes surface as 1006; HTTP can refresh cookies and verify the current role.
    try {
      const user = await apiFetch<CurrentUser>("/api/auth/me", {
        noRedirect: true,
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
      });
      if (closed) return;
      if (!["admin", "dosen"].includes(user.role)) {
        onMessage({ event: "disconnected" });
        return;
      }
    } catch (error) {
      if (closed) return;
      onMessage({ event: "disconnected" });
      if (!(error instanceof RedirectError)) retry();
      return;
    }
    const current = new WebSocket(endpoint.href);
    socket = current;
    current.onopen = () => {
      attempt = 0;
      onMessage({ event: "connected" });
    };
    current.onmessage = (event) => {
      let data: LogStreamEvent;
      try { data = JSON.parse(event.data) as LogStreamEvent; } catch { return; }
      if (data.event !== "connected") onMessage(data);
    };
    current.onclose = () => {
      if (socket !== current || closed) return;
      socket = null;
      onMessage({ event: "disconnected" });
      retry();
    };
    current.onerror = () => current.close();
  }

  void connect();
  return () => {
    closed = true;
    controller.abort();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close(1000, "client unmount");
  };
}

export interface LogStreamEvent {
  type?: "app_log" | "location_log" | "connected";
  student_id?: string;
  student_name?: string;  // returned by /api/logs/history for admin/dosen
  nim?: string;          // returned by /api/logs/history for admin/dosen
  log_date?: string;
  recorded_at?: string;
  total_screen_time_minutes?: number;
  social_media_time_minutes?: number;
  game_time_minutes?: number;
  unlock_count?: number;
  used_during_class?: boolean;
  is_on_campus?: boolean;
  matches_schedule?: boolean;
  program_studi_id?: string | null;
  latitude?: number;
  longitude?: number;
  distraction_score?: number | null;
  cluster_name?: string | null;
  // Geofence attendance verdict (only on app_log events during class time).
  // "inside" / "outside" / "unknown" — drives the Kehadiran di Kampus
  // metric card and the badge on the monitoring table.
  campus_id?: string | null;
  geofence_status?: string | null;
  event?: string;
  message?: string;
}

export function getLogHistory(limit = 100, signal?: AbortSignal) {
  return apiFetch<LogStreamEvent[]>(`/api/logs/history?limit=${limit}`, { signal });
}

export interface GeofenceSummary {
  inside: number;
  outside: number;
  unknown: number;
  total: number;
  inside_rate: number;  // 0.0–1.0, computed against inside+outside (unknown excluded)
  days: number;
}

export async function getGeofenceSummary(
  days = 7,
  signal?: AbortSignal
): Promise<GeofenceSummary> {
  return apiFetch<GeofenceSummary>(
    `/api/logs/geofence-summary?days=${days}`,
    { signal }
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModelVersion {
  id: string;
  version_number: number;
  training_date: string;
  dataset_size: number;
  is_active: boolean;
  status: "training" | "completed" | "failed";
  pca_n_components: number;
  kmeans_n_clusters: number;
  silhouette_score: number | null;
  cluster_distribution: Record<string, number>;
  cluster_labels: Record<string, string>;
  inertia: number | null;
  train_size: number | null;
  test_size: number | null;
}

export interface LatestResult {
  student_id: string;
  result_date: string;
  cluster_label: number;
  distraction_score: number;
  cluster_name: string;
}

export interface ReportResponse {
  avg_distraction_score: number | null;
  period: string;
  start_date: string;
  end_date: string;
  total_students: number;
  cluster_counts: Record<string, number>;
  avg_screen_time: number;
  avg_unlock_count: number;
  avg_social_media_time: number;
  avg_game_time: number;
  data: Array<{ student_id: string; avg_score: number }>;
  // Round 26 (P2): fields the server returns but the web interface
  // dropped. Used by the cluster filter dropdown — without these, the
  // filter shows "<all>" only and selecting any cluster silently does
  // nothing. Server-side (reports.py) sets both to None when no filter
  // is applied.
  cluster_filter?: string | number | null;
  cluster_filter_label?: string | null;
  cluster_labels?: Record<string, string>;
}

export interface Student {
  id: string;
  nim: string;
  full_name: string;
  study_program: string;
  semester: number;
  advisor_name?: string | null;
  cluster_label?: number | null;
  cluster_name?: string | null;
  distraction_score?: number | null;
  last_log_date?: string | null;
}

export interface LogBatch {
  student_id: string;
  synced: boolean;
  logs_count: number;
}

export interface AppLogInput {
  student_id: string;
  log_date: string;
  total_screen_time_minutes: number;
  social_media_time_minutes: number;
  game_time_minutes: number;
  unlock_count: number;
  used_during_class: boolean;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "dosen" | "mahasiswa";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  jabatan: string;
  jurusan: string;
  nip: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string | null;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  full_name: string;
  jabatan: string;
  jurusan: string;
  nip: string;
  role: UserRole;
  is_active: boolean;
}

export type UserUpdate = Partial<Omit<UserInput, "password">> & { password?: string };

export async function getUsers(opts: { signal?: AbortSignal } = {}): Promise<User[]> {
  return apiFetch<User[]>("/api/users", { signal: opts.signal });
}

export async function createUser(input: UserInput) {
  return apiFetch<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUser(id: string, data: UserUpdate) {
  return apiFetch<User>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string) {
  return apiFetch<void>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export async function changePassword(data: PasswordChange) {
  return apiFetch<{ message: string }>("/api/users/me/password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Self-service profile updates — wired through PUT /api/users/me. Without these,
// the profile page only mutated local state and `/api/auth/me` on next mount
// overwrote it from the server. Now saves persist to the User row.
export async function getMyProfile() {
  return apiFetch<User>("/api/users/me");
}

export interface ProfileUpdateInput {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
}

export async function updateMyProfile(data: ProfileUpdateInput) {
  return apiFetch<User>("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── System status ──────────────────────────────────────────────────────────

export interface ServiceStatus {
  status: string;
  version?: string;
  time?: string;
  response_ms?: number;
}

export interface MqttBrokerStatus {
  status: string;
  broker_url: string;
  connected: boolean;
}

export interface SystemStatus {
  server: ServiceStatus;
  database: ServiceStatus;
  redis: { status: string };
  mqtt_broker: MqttBrokerStatus;
  users: { total: number; active: number };
  current_user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
  } | null;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return apiFetch<SystemStatus>("/api/status");
}

export async function getActiveUsers(): Promise<{ users: User[]; count: number }> {
  return apiFetch<{ users: User[]; count: number }>("/api/status/active-users");
}

// ─── AI Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  message: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatWithAI(
  messages: ChatMessage[],
  options?: { model?: string; signal?: AbortSignal }
): Promise<ChatResponse> {
  // Server punya 4-key pool (round-robin + 429 fallback) + default
  // openai/gpt-oss-120b. Client tidak mengirim API key atau model,
  // kecuali operator eksplisit override via options.model.
  return apiFetch<ChatResponse>("/api/ai/chat", {
    method: "POST",
    signal: options?.signal,
    body: JSON.stringify({
      messages,
      ...(options?.model ? { model: options.model } : {}),
    }),
  });
}

export async function getGroqModels(): Promise<{ models: string[]; default: string }> {
  return apiFetch<{ models: string[]; default: string }>("/api/ai/models");
}

export interface ClusterContext {
  model: {
    v: number | null;
    s: string;
    k: number;
    pca: number;
    sil: number | null;
    ds: number;
    dist: Record<string, number>;
    lbl: Record<string, string>;
  };
  total: number;
  clustered: number;
  week: {
    sot: number;
    unlock: number;
    logs: number;
  };
  top_high: Array<{
    n: string;
    m: string;
    c: number;
    ds: number;
  }>;
  top_low: Array<{
    n: string;
    m: string;
    c: number;
    ds: number;
  }>;
  cluster_summary: Record<string, number>;
}

export async function getClusterContext(signal?: AbortSignal): Promise<ClusterContext> {
  return apiFetch<ClusterContext>("/api/ai/context", { signal });
}

// ─── Extended AI Context (read-only aggregate analytics) ────────────────────

export interface ExtendedContext {
  generated_at: string;
  model_history: Array<{
    v: number;
    s: string;
    k: number;
    pca: number;
    sil: number | null;
    ds: number;
    inertia: number | null;
    trained_at: string | null;
    is_active: boolean;
  }>;
  per_program: Record<string, Record<string, number>>;
  weekly_trends: Array<{
    week_start: string;
    week_end: string;
    avg_sot: number;
    avg_unlock: number;
    logs: number;
  }>;
  monthly_trend: {
    last_30_days: { avg_sot: number; logs: number };
    prior_30_days: { avg_sot: number; logs: number };
    sot_delta: number | null;
    logs_delta: number | null;
  };
  category_breakdown: {
    social_minutes: number;
    game_minutes: number;
    other_minutes: number;
    total_minutes: number;
    social_pct: number;
    game_pct: number;
    other_pct: number;
  };
  unlock_distribution: {
    buckets: Record<string, number>;
    samples: number;
    avg: number;
  };
  active_students: {
    active_this_week: number;
    active_last_30_days: number;
    total_registered: number;
    weekly_pct: number;
    monthly_pct: number;
  };
  model_health: {
    version: number;
    status: string;
    silhouette_score: number | null;
    inertia: number | null;
    dataset_size: number;
    train_size: number;
    test_size: number;
    k_clusters: number;
    pca_components: number;
    trained_at: string | null;
  } | null;
}

export async function getExtendedContext(): Promise<ExtendedContext> {
  return apiFetch<ExtendedContext>("/api/ai/extended-context");
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export interface SeedStatus {
  students_in_definition: number;
  students_in_db: number;
  logs_in_db: number;
  logs_from_seed: number;
  seed_data_ready: boolean;
}

export interface SeedGenerateResult {
  students_created: number;
  users_created: number;
  logs_created: number;
  total_logs: number;
  students_skipped: number;
  days: number;
}

export interface SeedClearResult {
  logs_cleared: number;
  students_cleared: number;
}

export interface InstitutionSettings {
  university_name: string;
  faculty: string;
  program: string;
  time_zone: string;
  logo_data_url: string;
}

export async function getInstitutionSettings(): Promise<InstitutionSettings> {
  return apiFetch<InstitutionSettings>("/api/institution");
}

export async function updateInstitutionSettings(
  data: Partial<InstitutionSettings>
): Promise<InstitutionSettings> {
  return apiFetch<InstitutionSettings>("/api/institution", {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

export async function getSeedStatus(): Promise<SeedStatus> {
  return apiFetch<SeedStatus>("/api/seed/status");
}

export async function generateSeedData(): Promise<SeedGenerateResult> {
  return apiFetch<SeedGenerateResult>("/api/seed/generate", { method: "POST" });
}

export async function clearSeedData(): Promise<SeedClearResult> {
  return apiFetch<SeedClearResult>("/api/seed/clear", { method: "DELETE" });
}
