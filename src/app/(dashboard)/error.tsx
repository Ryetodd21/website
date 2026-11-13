"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Round 26 audit (P0 #8) — Dashboard error boundary.
 *
 * Previously the (dashboard) segment had no error.tsx, so any uncaught
 * render exception in dashboard pages (N+1 fetch failure, malformed
 * server response, ref-to-DOM null, etc.) escaped to the framework
 * default error UI. In production standalone builds that surfaces as
 * a permanent blank screen — the user has to refresh the tab and
 * hope the next render doesn't hit the same issue.
 *
 * This boundary catches any error in the (dashboard) subtree, surfaces
 * an editorial-styled message, and offers reset() (re-render the failed
 * segment on the same URL) and a fallback link to /dashboard.
 */

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console so devs can find it during the
    // production-only repro. The error.digest is the server-side
    // request id when rendered in a server component; log it for
    // cross-referencing with the api logs.
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 sm:px-8 py-12">
      <div className="editorial-panel w-full max-w-xl p-6 sm:p-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          <span className="eyebrow text-warning">Kesalahan Tampilan</span>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 mt-0.5 h-9 w-9 border border-hairline rounded-none flex items-center justify-center bg-paper">
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="display-sans text-2xl sm:text-3xl text-ink leading-[1.1]">
              Halaman tidak dapat ditampilkan
            </h1>
            <p className="text-sm sm:text-base text-ink/65 mt-2 leading-relaxed">
              Terjadi kesalahan saat memuat bagian dasbor. Data Anda
              tetap aman. Coba muat ulang bagian ini, atau kembali ke
              dasbor untuk melihat ringkasan terbaru.
            </p>
          </div>
        </div>

        {error.digest && (
          <div className="border-t border-hairline pt-3 mt-4">
            <p className="eyebrow-sm text-ink/45 mb-1">Kode Penelusuran</p>
            <p className="font-mono text-xs text-ink/70 break-all">
              {error.digest}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="editorial-cta inline-flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
            Muat Ulang
          </button>
          <Link
            href="/dashboard"
            className="editorial-ghost inline-flex items-center gap-2"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={1.75} />
            Kembali ke Dasbor
          </Link>
        </div>
      </div>
    </div>
  );
}
