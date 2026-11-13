"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getInstitutionSettings, updateInstitutionSettings, type InstitutionSettings } from "@/lib/api";

export interface InstitutionProfile {
  universityName: string;
  faculty: string;
  program: string;
  timeZone: string;
  /** Base64 data URL for the logo (PNG/SVG), or null for the default icon. */
  logoDataUrl?: string | null;
}

const DEFAULT: InstitutionProfile = {
  universityName: "",
  faculty: "",
  program: "",
  timeZone: "WITA (UTC+8)",
  logoDataUrl: null,
};

const STORAGE_KEY = "institution_profile_v1";
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

interface Ctx {
  profile: InstitutionProfile;
  setProfile: (p: InstitutionProfile) => void;
  resetProfile: () => void;
  isLoaded: boolean;
}

const InstitutionContext = createContext<Ctx>({
  profile: DEFAULT,
  setProfile: () => {},
  resetProfile: () => {},
  isLoaded: false,
});

function toFrontend(raw: InstitutionSettings): InstitutionProfile {
  return {
    universityName: raw.university_name,
    faculty: raw.faculty,
    program: raw.program,
    timeZone: raw.time_zone,
    logoDataUrl: raw.logo_data_url || null,
  };
}

function toBackend(p: InstitutionProfile): Partial<InstitutionSettings> {
  return {
    university_name: p.universityName,
    faculty: p.faculty,
    program: p.program,
    time_zone: p.timeZone,
    logo_data_url: p.logoDataUrl ?? "",
  };
}

function readLocal(): InstitutionProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<InstitutionProfile>;
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}

function writeLocal(profile: InstitutionProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    // Notify same-tab subscribers
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch {
    // ignore quota / privacy errors
  }
}

function subscribeStorage(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function readLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error(`Logo terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB, maks 2 MB)`));
      return;
    }
    if (!/^image\/(png|svg\+xml|jpeg|webp)$/.test(file.type)) {
      reject(new Error(`Format tidak didukung: ${file.type || "?"} (pakai PNG/SVG/JPG)`));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = () => {
      if (file.type === "image/svg+xml") {
        resolve(String(reader.result));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const MAX = 512;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(String(reader.result)); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("File gambar tidak valid"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function InstitutionProvider({ children }: { children: ReactNode }) {
  // localStorage as initial snapshot so UI renders immediately (no flash of empty).
  const [profile, setProfileState] = useState<InstitutionProfile>(readLocal);
  const [isLoaded, setIsLoaded] = useState(false);
  const fetchedRef = useRef(false);

  // On mount: fetch from API if user is authenticated.
  // API data wins over localStorage so all users see the same institution name.
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getInstitutionSettings()
      .then((api) => {
        const p = toFrontend(api);
        setProfileState(p);
        writeLocal(p); // cache locally for next page load
      })
      .catch(() => {
        // API unavailable (e.g. session expired) — keep localStorage values
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const setProfile = useCallback((p: InstitutionProfile) => {
    writeLocal(p);
    setProfileState(p);
    // Persist to DB for other users. Write locally first so UI updates
    // immediately even if the API call takes a moment.
    updateInstitutionSettings(toBackend(p)).catch(() => {
      // Best-effort — if it fails, localStorage still holds the value
    });
  }, []);

  const resetProfile = useCallback(() => {
    writeLocal(DEFAULT);
    setProfileState(DEFAULT);
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const unsub = subscribeStorage(() => setProfileState(readLocal()));
    return unsub;
  }, []);

  return (
    <InstitutionContext.Provider value={{ profile, setProfile, resetProfile, isLoaded }}>
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution() {
  const ctx = useContext(InstitutionContext);
  if (!ctx) {
    return { profile: DEFAULT, setProfile: () => {}, resetProfile: () => {}, isLoaded: false } as Ctx;
  }
  return ctx;
}
