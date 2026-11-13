"use client";
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  studyProgram: string;
  faculty: string;
  // Optional — populated when the user uploads an avatar. Stored as a base64
  // data URL via PUT /api/users/me {avatar_url}.
  avatarUrl?: string;
}

// Fallback profile — used only when localStorage is empty.
// Real data is fetched from GET /api/users/me on mount.
// All fields default to empty so the UI shows blanks rather than fake values.
const DEFAULT_PROFILE: UserProfile = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  role: "",
  studyProgram: "",
  faculty: "",
};

// Round 26 (P2) audit + Round 29 (P1) audit: localStorage persists
// across tab close and browser restart. PII (full name, email, phone,
// avatar) leaks on a shared/kiosk device until explicit logout. The
// Round 26 logout fix (`logout()` in api.ts) removes this key, but
// a hard browser crash before logout would still leak it.
//
// Round 29: added a TTL of 24 hours. We wrap the profile in an
// envelope {savedAt, profile} — reads compare `savedAt` against
// `Date.now() - TTL_MS` and treat expired entries as "no cache"
// (falls through to the server-side fetch, which is the source of
// truth anyway). The 24-hour window is generous for an active
// session but bounds the leak window on a shared device where the
// user simply walked away without logging out.
//
// Trade-off: legitimate users who leave the dashboard open for >24h
// will see a one-render flash of empty profile while the server
// fetch re-populates the cache. Acceptable — the header shows
// initials + email from cookies/server, not the stale localStorage
// value, so the user doesn't see wrong data, just a brief loading
// state.
const STORAGE_KEY = "user_profile_v1";
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredEnvelope {
  savedAt: number;
  profile: UserProfile;
}

interface Ctx {
  profile: UserProfile;
  // Accept either a full profile or an updater callback so callers can do
  // `setProfile(prev => ({...prev, fullName: ...}))` without TypeScript
  // widening `prev` to `any`. The callback form mirrors React's setState API.
  setProfile: (p: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
}

const UserProfileContext = createContext<Ctx | null>(null);

function parseStored(raw: string | null): UserProfile {
  if (!raw) return DEFAULT_PROFILE;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredEnvelope>;
    // Round 29 audit P1 #12: support both the new envelope format
    // ({savedAt, profile}) and the legacy bare-profile format (no
    // envelope, no TTL). The legacy entries were written by Round 26
    // and earlier code; treat them as expired so they get re-saved
    // on the next profile fetch.
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "savedAt" in parsed &&
      "profile" in parsed &&
      typeof (parsed as StoredEnvelope).savedAt === "number"
    ) {
      const envelope = parsed as StoredEnvelope;
      if (Date.now() - envelope.savedAt > STORAGE_TTL_MS) {
        // Expired — return defaults; next writeStored will overwrite.
        return DEFAULT_PROFILE;
      }
      return { ...DEFAULT_PROFILE, ...envelope.profile };
    }
    // Legacy entry: no envelope, no savedAt. Treat as expired.
    return DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeStored(profile: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    const envelope: StoredEnvelope = { savedAt: Date.now(), profile };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // ignore quota / privacy errors
  }
  // Manually notify this tab's useSyncExternalStore subscribers — the native
  // 'storage' event only fires across tabs, not in the writing tab.
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

// useSyncExternalStore primitives — read from localStorage on every render
// and re-render on cross-tab 'storage' events. Writes inside this tab dispatch
// a synthetic event (above) so the same hook family re-runs getSnapshot.
//
// CRITICAL: getStoredSnapshot must return a stable reference when the
// underlying data hasn't changed. useSyncExternalStore compares snapshots
// with Object.is — a fresh `{...DEFAULT, ...JSON.parse(raw)}` literal on
// every call breaks referential equality and triggers the React "Maximum
// update depth exceeded" error (#185). The module-level cache keyed by raw
// JSON guarantees that two reads of the same string return the same object.
function subscribeStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

let _cachedRaw: string | null | undefined = undefined;
let _cachedSnapshot: UserProfile | null = null;

function getStoredSnapshot(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === _cachedRaw && _cachedSnapshot) return _cachedSnapshot;
  _cachedRaw = raw;
  _cachedSnapshot = parseStored(raw);
  return _cachedSnapshot;
}

function getServerSnapshot(): UserProfile {
  return DEFAULT_PROFILE;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  // localStorage is the single source of truth — covers initial mount,
  // cross-tab updates, and same-tab writes via the synthetic event above.
  const profile = useSyncExternalStore(subscribeStorage, getStoredSnapshot, getServerSnapshot);

  // Pull full server profile on first mount so phone, avatar_url, etc. also
  // surface here. Tokens live in HttpOnly cookies, so we use credentials.
  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(`${API_BASE}/api/users/me`, {
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        // Merge server data on top of the current profile (which may already
        // be the freshly-localStorage-loaded one). writeStored() then fires
        // the synthetic storage event so the hook re-runs getSnapshot.
        writeStored({
          ...DEFAULT_PROFILE,
          fullName: data.full_name ?? DEFAULT_PROFILE.fullName,
          email: data.email ?? DEFAULT_PROFILE.email,
          role: data.role ?? DEFAULT_PROFILE.role,
          phone: data.phone ?? DEFAULT_PROFILE.phone,
          avatarUrl: data.avatar_url ?? DEFAULT_PROFILE.avatarUrl,
          username: data.username ?? DEFAULT_PROFILE.username,
          // Round 8: header subtitle shows the user's own department/program
          // rather than the institution-wide default. Fall back to prev so
          // empty strings don't clobber a previously-cached value.
          studyProgram: data.jurusan ?? DEFAULT_PROFILE.studyProgram,
        });
      } catch {
        // ignore — fall back to cached profile
      }
    }
    void fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const setProfile = useCallback((p: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    const next = typeof p === "function" ? p(profile) : p;
    writeStored(next);
  }, [profile]);

  return <UserProfileContext.Provider value={{ profile, setProfile }}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    // Safe fallback for components rendered outside the provider (e.g. login page)
    return {
      profile: DEFAULT_PROFILE,
      setProfile: () => {},
    } as Ctx;
  }
  return ctx;
}

export function getInitials(name: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
