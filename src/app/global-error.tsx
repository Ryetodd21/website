"use client";
import Link from "next/link";

import { useEffect } from "react";

/**
 * Round 26 audit (P0 #8) — Root-level error boundary.
 *
 * This is the LAST line of defense — it renders when the root layout
 * itself fails (e.g. theme provider crash, font loader error, or
 * anything outside any nested error boundary). It MUST be its own
 * minimal <html> + <body> because the root layout's <html>/<body>
 * are already broken at this point.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "oklch(0.985 0.005 80)",
          color: "#000",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.25rem",
        }}
      >
        <div
          style={{
            maxWidth: "32rem",
            width: "100%",
            border: "1px solid oklch(0.86 0.005 80)",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span
              style={{
                width: "0.375rem",
                height: "0.375rem",
                borderRadius: "9999px",
                background: "oklch(0.72 0.16 80)",
              }}
            />
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "oklch(0.72 0.16 80)",
              }}
            >
              Kesalahan Sistem
            </span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
            Monitor UNG tidak dapat melanjutkan
          </h1>
          <p style={{ marginTop: "0.75rem", color: "oklch(0.18 0.01 260 / 0.65)", lineHeight: 1.5 }}>
            Terjadi kesalahan tingkat sistem. Coba muat ulang halaman, atau
            kembali ke beranda.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: "0.75rem",
                color: "oklch(0.18 0.01 260 / 0.55)",
                wordBreak: "break-all",
              }}
            >
              {error.digest}
            </p>
          )}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "0.5rem 1rem",
                background: "oklch(0.444 0.177 26.899)",
                color: "oklch(0.96 0.004 80)",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Muat Ulang
            </button>
            <Link
              href="/"
              style={{
                padding: "0.5rem 1rem",
                color: "oklch(0.505 0.213 27.518)",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "1px solid oklch(0.86 0.005 80)",
              }}
            >
              Beranda
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
