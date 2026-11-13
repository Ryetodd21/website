"use client";

import Link from "next/link";
import { Lock, Smartphone, ArrowLeft, ShieldAlert } from "lucide-react";
import { useUserProfile } from "@/lib/user-profile";

// Roles allowed to use the full staff dashboard. Mahasiswa users should
// use the mobile Android app, not the web dashboard.
export const STAFF_ROLES = ["admin", "dosen"];

// The default UserProfile fallback uses title-case strings like
// "Admin Program Studi" — treat that as "role not yet fetched" rather
// than a real role, otherwise we'd deny staff access during the brief
// window before /api/auth/me returns.
const KNOWN_ROLES = ["admin", "dosen", "mahasiswa"];

interface RoleGateProps {
  /** Lowercase role names allowed to render children. */
  allow: string[];
  children: React.ReactNode;
  /** Custom fallback element; defaults to <AccessDenied />. */
  fallback?: React.ReactNode;
  /** Show a loading spinner while role is still being fetched. */
  showLoading?: boolean;
}

/**
 * Client-side role check. Renders children only when the current user's role
 * is in `allow`. While the role is being fetched we render the children
 * optimistically — the server will reject with 403 if we guessed wrong.
 *
 * This is a defence-in-depth measure; the real protection is the role check
 * on the API route. Use this component to avoid showing empty/broken pages
 * to non-staff users who type a staff URL directly.
 */
export function RoleGate({ allow, children, fallback, showLoading = false }: RoleGateProps) {
  const { profile } = useUserProfile();
  const role = (profile.role || "").toLowerCase().trim();
  // Role is "known" only when it matches one of the canonical role strings.
  // The default-profile placeholder ("Admin Program Studi") is treated as
  // unknown so we don't deny staff during the loading window.
  const roleKnown = KNOWN_ROLES.includes(role);

  if (!roleKnown) {
    if (showLoading) {
      return (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Memeriksa akses...</p>
          </div>
        </div>
      );
    }
    // Optimistic: render children so the page paints fast. API will 403 if wrong.
    return <>{children}</>;
  }

  if (!allow.includes(role)) {
    return <>{fallback ?? <AccessDenied role={profile.role} />}</>;
  }

  return <>{children}</>;
}

interface AccessDeniedProps {
  role?: string;
}

/**
 * Friendly "you don't have access" page for staff-only routes accessed by
 * a non-staff user. Editorial palette: paper bg, ink text, hairline rules,
 * numbered eyebrow. No glass, no amber-100 / violet-100 fills.
 */
export function AccessDenied({ role }: AccessDeniedProps) {
  const roleLabel = role || "akun Anda";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="editorial-panel animate-fade-up w-full max-w-xl">
        {/* Eyebrow + icon row */}
        <div className="px-7 pt-7 pb-5 border-b border-hairline flex items-center gap-4">
          <div className="h-11 w-11 border border-hairline flex items-center justify-center text-ink shrink-0">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="eyebrow text-ink/55">00 · Akses Terbatas</div>
            <h2 className="display-sans text-2xl text-ink mt-1.5 leading-[1.05]">
              Halaman ini hanya untuk Admin dan Dosen.
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5">
          <p className="text-sm text-ink/70 leading-relaxed">
            Anda masuk sebagai{" "}
            <span className="font-mono font-semibold text-ink">{roleLabel}</span>.
            Akun dengan peran tersebut tidak memiliki akses ke dasbor staf.
            Hubungi admin institusi untuk perubahan peran.
          </p>

          {/* Mobile-app prompt — hairline border, no violet fill */}
          <div className="border border-hairline p-4 flex items-start gap-3">
            <div className="h-9 w-9 border border-hairline flex items-center justify-center text-ink shrink-0">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink mb-1">
                Gunakan Aplikasi Mobile
              </p>
              <p className="text-xs text-ink/60 leading-relaxed">
                Untuk mengirim data aktivitas belajar harian, gunakan aplikasi
                mobile Android Monitor UNG yang terpasang di perangkat Anda.
              </p>
            </div>
          </div>

          {/* Numbered hint list */}
          <ol className="space-y-2 border-t border-hairline pt-4">
            <li className="flex items-baseline gap-3">
              <span className="eyebrow-sm text-ink/45 shrink-0">01</span>
              <span className="text-xs text-ink/70 leading-relaxed">
                Dasbor ini diperuntukkan bagi Admin dan Dosen untuk membaca
                pola belajar mahasiswa bimbingan.
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="eyebrow-sm text-ink/45 shrink-0">02</span>
              <span className="text-xs text-ink/70 leading-relaxed">
                Jika Anda merasa peran akun salah, hubungi admin program studi
                Anda untuk verifikasi.
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="eyebrow-sm text-ink/45 shrink-0">03</span>
              <span className="text-xs text-ink/70 leading-relaxed">
                Data pribadi Anda tetap aman dan dapat dikelola di halaman
                Profil.
              </span>
            </li>
          </ol>
        </div>

        {/* Footer actions */}
        <div className="px-7 py-4 border-t border-hairline flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Link href="/" className="editorial-ghost">
            <ArrowLeft className="h-3.5 w-3.5" />
            Ke Beranda
          </Link>
          <Link href="/profile" className="editorial-cta">
            <Lock className="h-3.5 w-3.5" />
            Ke Profil Saya
          </Link>
        </div>
      </div>
    </div>
  );
}
