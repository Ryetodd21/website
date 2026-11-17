import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  // Semua <Image> di sini berukuran kecil & sudah pas (logo 40px, avatar 240/56).
  // unoptimized membuang proses sharp dari node server.js — hemat RAM container.
  images: {
    unoptimized: true,
  },
  // Round 27 (P1 routing): Next.js standalone tidak serve /api/*. Browser
  // call ke https://monitorterop.my.id/api/auth/login → Cloudflare tunnel
  // → web container (172.18.0.9:3000) → 404 (Next.js tidak punya route).
  //
  // Cloudflare tunnel sedang remotely-managed (dashboard push config override
  // local file), sehingga path-based rule di local config tidak dipakai.
  //
  // Fix: rewrite di Next.js → proxy /api/* ke FastAPI via Docker service
  // name `api` (container di network yang sama, DNS internal resolve).
  // Browser tidak perlu tahu FastAPI URL — semua lewat web container.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://api:8000/api/:path*`,
      },
    ];
  },
  // Round 27 audit (P1-1): all HTML pages (public + dashboard) get
  // `no-cache, no-store, must-revalidate` so Cloudflare edge never caches
  // them. Next.js's default `s-maxage=31536000` (1 TAHUN) for prerendered
  // public pages makes users see stale UI after a web rebuild until the
  // edge cache expires. Static `_next/static/*` chunks keep `immutable`
  // cache (rule di bawah). Without no-cache for HTML, after a web rebuild
  // the browser's cached index.html references chunk filenames that no
  // longer exist, and Chrome shows "This page couldn't load".
  async headers() {
    // Round 26 audit (P1): security headers applied globally below.
    // CSP allows inline styles (Next.js inlines style attributes) and
    // unsafe-eval (Next.js dev tooling + Recharts). HSTS is HTTPS-only —
    // Cloudflare is the only ingress so this is safe globally.
    const baseSecurityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: [
          ...baseSecurityHeaders,
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "font-src 'self' data:",
              // Round 29 audit P2 #3: tightened from 'https:' to specific
              // domains. See website/src/middleware.ts for the rationale.
              "img-src 'self' data: blob: https://avatars.githubusercontent.com https://*.tile.openstreetmap.org",
              // Round 29 audit P2 #2: removed `http://localhost:8000`.
              "connect-src 'self' https://monitorterop.my.id ws: wss:",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/monitoring/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/students/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/reports/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/logs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/ai/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/akademik/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/settings/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/profile/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // Round 31 follow-up: chunks are content-hashed, so `immutable`
        // is technically correct — but in practice Firefox aggressively
        // retains the previous build's chunk when only a tiny edit (1
        // line in api.ts) is rolled out, leaving users running the old
        // PRIMARY/FALLBACK order for the full 1 year. Setting `max-age=300`
        // (5 min) on the chunks means a deploy is picked up by the next
        // page reload at most 5 min later, which is fine for a dashboard.
        // The hash in the filename is still the cache-busting mechanism;
        // this just sets a sane upper bound on how long the browser holds
        // a stale version if Cloudflare serves the same hash from a
        // previous build.
        //
        // Must come BEFORE the `/_next/static/:path*` rule below — Next.js
        // headers() processes rules in order and the FIRST match wins.
        source: "/_next/static/chunks/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Round 27 audit (P1-1): public pages no longer cached at edge.
      // Tanpa rule ini, Next.js's default s-maxage=31536000 (1 TAHUN)
      // membuat Cloudflare edge cache HTML halaman publik, sehingga
      // setelah rebuild web, user tetap melihat versi lama sampai
      // cache di-purge. Dengan `no-cache, no-store, must-revalidate`,
      // browser/edge selalu revalidate ke origin. Static chunks tetap
      // immutable via rule di atas.
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/login",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/register",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/privacy",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/changelog",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
