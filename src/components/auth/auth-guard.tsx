"use client";

import { useEffect, useState } from "react";

import { apiFetch, RedirectError } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const controller = new AbortController();
    const check = async () => {
      timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        await apiFetch("/api/auth/me", { signal: controller.signal });
        if (cancelled) return;
        if (timeout) clearTimeout(timeout);
        setChecking(false);
      } catch (e) {
        if (cancelled) return;
        if (timeout) clearTimeout(timeout);
        if (e instanceof RedirectError) {
          return;
        }
        setError("Sesi belum dapat diperiksa. Periksa koneksi, lalu coba lagi.");
      }
    };
    check();
    return () => {
      cancelled = true;
      controller.abort();
      if (timeout) clearTimeout(timeout);
    };
  }, [attempt]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p role="alert">{error}</p>
        <button className="editorial-cta" onClick={() => { setError(null); setAttempt(value => value + 1); }}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
