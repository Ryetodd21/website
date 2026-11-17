import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Round 26 audit (P1): security headers added via proxy because the
// `headers()` block in next.config.ts only applies to dynamic SSR routes.
// Static prerendered pages (which the public landing/login/register are)
// are served directly from the .next prerender cache and skip the
// headers() callback entirely. Proxy runs for every matched request
// before any response — including the static ones — so this is the
// reliable place to enforce CSP, HSTS, X-Frame-Options, etc.
//
// Next.js 16: the `middleware` file convention is deprecated in favour of
// `proxy`. Same API (`config.matcher` unchanged), but proxy always runs on
// the Node.js runtime, so the Edge Runtime warning from this file is gone.
//
// The next.config.ts `/:path*` rule is kept as a defense in depth for
// dynamic routes (the (dashboard) subtree, /api/* rewrites).
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // Round 30 audit (P2): 'unsafe-eval' is required by Next.js dev
    // tooling and Recharts runtime; in production builds it is an XSS
    // amplifier (allows eval-based payload execution). Gate on
    // NEXT_PUBLIC_ALLOW_UNSAFE_EVAL — production deployments set this
    // to false (or leave it unset, which defaults to false).
    `script-src 'self' 'unsafe-inline'${
      process.env.NEXT_PUBLIC_ALLOW_UNSAFE_EVAL === "true" ? " 'unsafe-eval'" : ""
    } https://static.cloudflareinsights.com`,
    "font-src 'self' data:",
    // Round 29 audit P2 #3: tightened img-src from 'https:' to specific
    // domains. Sources we actually load:
    //   data: / blob:  — base64 avatars + user uploads
    //   'self'         — local /ung-logo.webp + Next.js image opt
    //   github.com     — landing page contributor + creator avatars
    // Any future image source must be added to this list explicitly.
    "img-src 'self' data: blob: https://avatars.githubusercontent.com https://*.tile.openstreetmap.org",
    // Round 29 audit P2 #2: removed `http://localhost:8000` from
    // connect-src. That was the dev backend URL leaking into the
    // production CSP. An XSS on a production page could exfiltrate
    // data to a localhost listener in a shared-host scenario
    // (Docker host with port 8000 mapped, k8s pod sidecar, etc).
    "connect-src 'self' https://monitorterop.my.id ws: wss:",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; "),
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets (anything with a file extension) are served without CSP.
  // Auth is handled by the client-side AuthGuard — the proxy cannot read the
  // HttpOnly cookie set by the FastAPI backend.
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  return applySecurityHeaders(NextResponse.next());
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static files with extensions (images, fonts, etc.)
     * - API routes (handled by FastAPI backend)
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
