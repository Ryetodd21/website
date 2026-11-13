---
name: nextjs-web-dashboard
description: "Monitor UNG Next.js 16 web dashboard — Tailwind v4 CSS-based config, shadcn/ui v4, cookie-only auth, 3-state theme cycle, WebSocket primary real-time transport, SSE legacy, RoleGate for RBAC, colorblind-safe Okabe-Ito palette, premium UI/UX design system."
metadata:
  type: project
---

# Monitor UNG Website — Editorial Type-Forward Dashboard

## Tech Stack

- **Next.js** 16.3.5 + **React** 19 + **App Router**
- **Tailwind CSS v4** — CSS-based config, NO `tailwind.config.js`
- **shadcn/ui** v4 — components from `@base-ui/react`
- **Recharts** — charts (Area, Bar, Pie, Scatter, Line)
- **Leaflet** — campus geofence map picker
- **Sonner** — toast notifications
- **Lucide React** — icons
- **Inter** + **Fraunces** + **JetBrains Mono** fonts via `next/font/google`
- Standalone build output for Docker

---

## Design System — Editorial Type-Forward (SAIC reference)

The web dashboard follows an editorial, type-driven aesthetic — minimal palette, massive serif headlines, ALL CAPS eyebrow labels, asymmetric grid, generous whitespace. No glass morphism, no colored icon badges, no rounded corners larger than 2px. Most visual hierarchy comes from typography and hairlines, not color.

**Reference:** [School of the Art Institute of Chicago](https://www.saic.edu) — a modern editorial art-school voice. Clean, confident, paper-flat.

### Color Palette — Okabe-Ito (Colorblind-Safe) + Editorial Canvas

Two layers: **semantic status colors** (Okabe-Ito, colorblind-safe) and an **editorial canvas** (paper / ink / hairline).

**Editorial canvas tokens** (the only colors used for chrome):

| Token | Light (paper) | Dark | Purpose |
|-------|---------------|------|---------|
| `--paper` | `oklch(0.985 0.005 80)` warm cream | `oklch(0.16 0.008 260)` | Background canvas |
| `--ink` | `oklch(0.18 0.01 260)` near-black | `oklch(0.96 0.004 80)` | Text + primary CTA fill |
| `--hairline` | `oklch(0.86 0.005 80)` | `oklch(0.28 0.008 260)` | 1px borders, dividers |
| `--primary` | `oklch(0.52 0.19 255)` Okabe-Ito Blue | `oklch(0.65 0.20 255)` | The ONE accent — primary CTA hover, active states, focus rings |

Tailwind exposes these as `bg-paper`, `text-ink`, `border-hairline`, `bg-primary`, `text-primary`, `border-primary`. The semantic `--background` and `--foreground` aliases now resolve to the paper/ink tokens so shadcn primitives inherit the editorial canvas automatically.

**Semantic status colors** (Okabe-Ito, used sparingly — never as fills, only as text + dots):

| Hue | Light | Dark | CSS Variable | Purpose |
|-----|-------|------|-------------|---------|
| Blue 255° | `oklch(0.52 0.19 255)` | `oklch(0.65 0.20 255)` | `--primary` | Brand / active / online |
| Teal 175° | `oklch(0.55 0.14 175)` | `oklch(0.72 0.15 175)` | `--success` | Success (NOT green) |
| Amber 80° | `oklch(0.72 0.16 80)` | `oklch(0.80 0.16 80)` | `--warning` | Warning / in-progress |
| Fuchsia 340° | `oklch(0.55 0.22 340)` | `oklch(0.70 0.22 340)` | `--destructive` | Error / danger (NOT red) |
| Cyan 220° | `oklch(0.58 0.14 220)` | `oklch(0.75 0.14 220)` | `--info` | Info |

**Usage rule:** Status colors appear ONLY as small dots + uppercase eyebrow text (e.g., `· ONLINE`). Never as filled pills or full-row tints. Backgrounds use `bg-paper` (white) only.

Chart palette: `--chart-1` sky(210), `--chart-2` blue(255), `--chart-3` orange(50), `--chart-4` teal(175), `--chart-5` magenta(340).

**All WCAG AA contrast ≥4.5:1** — editorial paper + ink is ~14:1, far exceeding minimum.

### Typography — Inter + Montserrat + Fraunces + JetBrains Mono

Four fonts loaded via `next/font/google` (zero install — built into Next.js):

| Family | Role | Sizes |
|--------|------|-------|
| **Montserrat** (heavy grotesque sans) | Primary display headlines, H1/H2, card titles. SAIC-pattern institutional + section titles. Weight 800–900 with tight tracking (-0.03em). | 32–136px display |
| **Fraunces** (variable serif) | Italic accent lines, pull quotes, body editorial moments. Optional opsz axis for optical sizing. | 24–48px italic |
| **Inter** (sans) | Body, UI controls, captions, table cells, eyebrow labels, all input text | 11–16px |
| **JetBrains Mono** | Code, numeric metrics, NIMs, IDs, tag pills | 11–14px |

CSS vars: `--font-montserrat`, `--font-fraunces`, `--font-inter`, `--font-jetbrains-mono`. Tailwind aliases: `font-sans` (Inter), `font-serif` (Fraunces), `font-mono` (JetBrains), `font-display` (Montserrat).

**Editorial type scale (SAIC-pattern):**

| Class | Use | Tracking |
|-------|-----|----------|
| `.display-sans` | H2/H3 headlines, card titles (Montserrat 800) | `letter-spacing: -0.03em`, `line-height: 0.92` |
| `.display-sans-uc` | Uppercase wordmarks + nav (Montserrat 800 uppercase) | `letter-spacing: -0.025em` |
| `.display-sans-black` | Hero h1, institutional headlines (Montserrat 900) | `letter-spacing: -0.035em`, `line-height: 0.88` |
| `.display-italic` | Pull quotes, brand accent (Fraunces italic) | `letter-spacing: -0.015em` |
| `.eyebrow` | ALL CAPS section labels (11px) | `letter-spacing: 0.18em`, weight 600 |
| `.eyebrow-sm` | Inline caps labels (10px) | `letter-spacing: 0.22em`, weight 700 |
| `.eyebrow-dot` | Small colored dot before eyebrow caps (4px radius) | inline-flex parent |

**Typography rule:** Use `.display-sans*` for primary headlines (matching SAIC institutional aesthetic), reserve `.display-italic` (Fraunces) for accent + pull quotes only.

### Spacing — 8px Grid + Asymmetric

All spacing multiples of 4px. Standard: `space-2` (8px, min touch target), `space-4` (16px, standard padding), `space-8` (32px, section gaps). Editorial panels use `p-5`/`p-6` (20–24px) with `space-y-6`/`space-y-8` between sections.

### Editorial Primitives

Replaces the previous glass-card / pill-badge vocabulary:

| Primitive | Class | Use |
|-----------|-------|-----|
| **Editorial Panel** | `.editorial-panel` | Section / card container. `bg-paper` + `border-radius: 2px`. No border, no shadow, no glass, no large radius. Cards must add `w-full min-w-0` to expand into grid cells. |
| **Hairline Rule** | `.rule` | Single 1px line — used between sections, between rows in tables, between metric cells. |
| **Editorial Input** | `.editorial-input` | Form field. Bottom-border only, no fill, no rounding. Replaces pill-shaped shadcn `Input`. |
| **Editorial CTA** | `.editorial-cta` | Solid ink button (single accent reserved for hover). `border-radius: 2px`, `letter-spacing: 0.06em`. |
| **Editorial Ghost** | `.editorial-ghost` | Text-only secondary CTA with animated underline reveal. |
| **Status Badge** | `StatusBadge` component | Colored dot + uppercase eyebrow text. No pill background. |
| **Section Header** | `SectionHeader` component | `.display` H3 + eyebrow sub + optional right slot. Pages add their own hairline + body padding. |
| **Page Header** | `PageHeader` component | Editorial eyebrow row (date, status, number) + `.display-sans text-2xl sm:text-3xl lg:text-4xl` H1 + body subtitle + right actions. Compact padding `pb-4 sm:pb-5`. Replaces glass badge bar. |

**Usage rule:** Never use `glass-card`, `glass-header`, `rounded-xl`, `rounded-2xl`, `bg-emerald-*`, `bg-blue-*`, `bg-amber-*`, `bg-violet-*`, `bg-rose-*` as background fills on chrome. Status colors stay in text + dots only.

### Components

| Area | Pattern |
|------|---------|
| **Sidebar** | Numbered typographic rows (`01 / Dashboard`, `02 / Monitoring`...). Active row = eyebrow number in primary + 2px primary bar + ink label. No icons, no colored backgrounds. |
| **Header** | Left: wordmark + eyebrow page title. Center: bottom-border-only search input, text-only dropdown. Right: notification bell + text-only theme toggle + avatar dropdown. |
| **Landing header (public)** | Brand left, then **direct nav links** (TOPIC: Tentang / Sistem / Cara Kerja / Kontributor) in ALL CAPS Montserrat with hover underline reveal, then **dropdown groups** (AKUN ▼ / BANTUAN ▼) with chevron-down that rotates 180° when open. Dropdown panel is dark ink-on-paper with hairline dividers and slide-down animation. SAIC-pattern two-tier nav (info links left, action menus right). |
| **Metric Strip** | Responsive grid: `grid-cols-2 lg:grid-cols-3` or `lg:grid-cols-4` (2 cards mobile, 3-4 cards laptop+). Each `MetricCard` is hairline-only — the parent `gap-px bg-hairline` grid is the **only** separator between cards (no per-card border, no coloured tint, no pill background). Section wrapper is plain `border-t border-hairline` with no `bg-section-*` tint. Each card carries a numbered eyebrow prefix (`01`, `02`, ...) so they read as a single editorial list. Status as `StatusBadge` (dot + caps) on the right. |
| **Charts** | Recharts in `.editorial-panel` wrappers. Tooltips use `bg-paper` + hairline border, no backdrop-blur. |
| **Tables** | Hairline-divided rows (no zebra stripes, no rounded row cards). Status shown as inline dot + text, not filled pills. |
| **Forms** | `.editorial-input` (bottom-border only). Labels as eyebrow caps above. CTAs as `.editorial-cta`. |
| **Dialogs / Modals** | shadcn `Dialog` content — flat border, hairline, paper bg. Status indicators inside use eyebrow caps + dot. |
| **Cluster Badge** | `ClusterBadge` component — colored dot + uppercase label, no filled background. Used in students, logs, monitoring, models tables. |
| **Editorial Pill** | `EditorialPill` — replaces tinted pill badges (`bg-teal-100 text-teal-700`). Editorial dot + uppercase label. |

```tsx
// CORRECT — hairline-only grid; each cell is paper bg, parent provides separator
<section className="border-t border-hairline">
  <div className="grid gap-px grid-cols-2 lg:grid-cols-4 bg-hairline">
    <MetricCard icon={Users} label="Total" value="42" number="01" delay={0} />
    <MetricCard icon={Zap}   label="Sync" value="12" number="02" delay={80} />
    <MetricCard icon={Heart} label="Sehat" value="33" number="03" delay={160} />
    <MetricCard icon={Alert} label="Tinggi" value="9" number="04" delay={240} />
  </div>
</section>
```

`ColorMetricCard` (with `tint="emerald"|"blue"|"amber"|"violet"|"rose"` props) is kept in `metric-card.tsx` for any legacy imports but is **not** used in any page as of round-4. New strips should use `MetricCard` only.

### Motion

Same duration scale (100–600ms). Editorial motion is subtler than glass-morphism:

- `.animate-fade-up` — 300ms entrance, opacity + 8px Y
- `.animate-glass-enter` — replaced with the same `.animate-fade-up` (no blur)
- Hairline-draw animations on focus / hover (200ms ease-out)
- View Transitions still drive `auth-card` morph (login ↔ register) — kept verbatim
- `.marquee` / `.marquee-track` — continuous 40s horizontal ticker, paused on hover
- `.pillar-art` hover — `scale(1.08) rotate(-2deg)` over 320ms with spring easing
- `.feature-card` hover — `translateY(-3px)` + icon scales `1.12 rotate(-3deg)`
- `.editorial-cta svg` hover — arrow icon slides `4px right + 2px up` over 280ms
- `.section-wipe` — section tints fade in from `translateY(20px)` on enter
- `.stat-rise` — staggered stats rise (0ms/80ms/160ms/240ms delays)
- `.in-view` from `useInView()` — triggers all above on scroll
- `@media (prefers-reduced-motion: reduce)` disables all animations, marquee, and view transitions

### What Was Removed

- `glass-card`, `glass-header`, `glass-sidebar`, `glass-notif`, `notif-panel`, `notif-panel-strong` — all glass classes deprecated
- `icon-badge`, `action-row`, `nav-item`, `.bg-success-soft`/`.bg-warning-soft`/`.bg-danger-soft` — pill/badge vocabulary deprecated
- `rounded-xl`, `rounded-2xl`, `rounded-3xl` chrome
- `bg-gradient-to-br`, `bg-emerald-100`/etc fills, `backdrop-blur-*`
- Colored metric `tint` props (emerald/blue/amber/violet/rose) on `ColorMetricCard` — component kept in `metric-card.tsx` for any legacy imports, but **not used by any page** as of round-4. All strips use `MetricCard` (no tint, no border — parent `gap-px bg-hairline` grid is the only separator)

### Accessibility — WCAG 2.1 AA

- **Contrast**: ink on paper ≈ 14:1 ✓ (exceeds 4.5:1 minimum)
- **Focus**: every interactive element has `:focus-visible` ring (ink + offset)
- **ARIA**: icon-only buttons get `aria-label`, charts get `aria-label`, dynamic content uses `aria-live`
- **Keyboard**: Tab navigation, Enter/Space activation, Escape closes dialogs/sheets
- **Semantic HTML**: proper heading hierarchy, landmarks (`<main>`, `<nav>`, `<aside>`)
- **Motion**: `prefers-reduced-motion` disables all animations and view transitions

---

## Animation System

### Duration Scale

| Label | Duration | Use Case |
|-------|----------|----------|
| Instant | 100ms | Micro-interactions (checkbox, toggle) |
| Fast | 150ms | Hover states, small transitions |
| Normal | 200ms | Standard UI transitions |
| Slow | 300ms | Page transitions, large elements |
| Glacial | 400-600ms | Hero animations, scroll reveals |

### Easing Curves

```css
--ease-smooth:  cubic-bezier(0.22, 1, 0.36, 1)   /* standard ease-out */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1) /* spring-like */
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)     /* symmetric */
--ease-sharp:   cubic-bezier(0.4, 0, 0.6, 1)     /* quick in, slow out */
```

### Scroll-Triggered Reveal

Uses `useInView()` hook + `.in-view` CSS class:
- IntersectionObserver: `{ threshold: 0.12, rootMargin: "0px 0px -8% 0px" }`
- Fire-once (disconnects after first trigger)
- Stagger via `animationDelay`: 40ms (cards), 60-80ms (steps), 100-150ms (sections)
- **Always** include `@media (prefers-reduced-motion: reduce)` override

---

## Accessibility — WCAG 2.1 AA

- **Contrast**: All text ≥4.5:1. Primary text `oklch(0.14)` on light `oklch(0.97)` = 14.2:1 ✓
- **Focus**: Every interactive element has `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **ARIA**: Icon-only buttons get `aria-label`, charts get `aria-label`, dynamic content uses `aria-live`
- **Keyboard**: Tab navigation, Enter/Space activation, Escape closes dialogs/sheets
- **Semantic HTML**: Proper heading hierarchy (no skip levels), landmarks (`<main>`, `<nav>`, `<aside>`)
- **Motion**: `prefers-reduced-motion` disables all animations

---

## Theme System

- 3-state cycle: `light` → `dark` → `system` → `light`
- Stored in `localStorage` key `monitor-ung-theme`
- **Anti-FOUC**: `THEME_INIT_SCRIPT` in `<head>` before React hydrates
- Applied via `document.documentElement.classList.toggle("dark")`
- Responds to system `matchMedia` changes live

**Tailwind v4 dark strategy:** `@custom-variant dark (&:is(.dark *))` — any `.bg-foo` gets sibling `dark:bg-foo-dark` automatically.

---

## Auth — Cookie Only

- **NO localStorage** for tokens
- `apiFetch()` always uses `credentials: "include"`
- `getCurrentUser()` → `GET /api/auth/me` via cookie
- Middleware (`src/middleware.ts`) doesn't read HttpOnly cookies — auth is client-side only
- 401 → token refresh → retry → redirect to `/login`

---

## RBAC

- `STAFF_ROLES = ["admin", "dosen"]`
- `RoleGate` component wraps children if role matches `allow` prop
- Applied at `(dashboard)/layout.tsx` via `STAFF_PATH_PREFIXES`
- `mahasiswa` users see `AccessDenied` with "Gunakan Aplikasi Mobile"
- Sidebar switches: `mainNav` (staff) vs `memberNav` (mahasiswa)

---

## Real-time Stream (WebSocket primary, SSE legacy)

```typescript
// Primary: WebSocket (bidirectional, lower-overhead, no EventSource polyfill needed)
const ws = new WebSocket(`${wsBase}/api/logs/stream/ws`, token ? [`${token}`] : []);
ws.onmessage = (e) => { /* JSON LogStreamEvent per message */ };

// Legacy fallback: SSE via EventSource
await fetch(`${API_BASE}/api/logs/stream-auth`, { method: "POST", credentials: "include" });
const es = new EventSource(`${API_BASE}/api/logs/stream`, { withCredentials: true });
```

`subscribeLogsStream()` (SSE-only) was removed in Round 27; `subscribeLogsStreamWebSocket()` is now the primary transport.

---

## File Map

```
src/app/
├── page.tsx                   # Redirects to _components/landing-view
├── _components/
│   └── landing-view.tsx       # Full marketing landing (public)
├── (dashboard)/
│   ├── layout.tsx            # AuthGuard + RoleGate + Sidebar + Header
│   ├── dashboard/page.tsx     # Overview metrics
│   ├── students/page.tsx      # Student CRUD (paginated)
│   ├── reports/page.tsx       # Aggregate reports
│   ├── ai/page.tsx           # Groq AI chat
│   ├── models/page.tsx       # ML training + scatter plot
│   ├── logs/page.tsx         # Real-time log viewer
│   ├── monitoring/page.tsx   # Server activity (WebSocket primary, SSE legacy)
│   ├── profile/page.tsx
│   └── settings/page.tsx
├── login/page.tsx             # ViewTransition morph with register
├── register/page.tsx          # 3 fieldsets, role selector
├── privacy/page.tsx           # Privacy policy
├── layout.tsx                 # Root layout (fonts, metadata)
└── globals.css                # Tailwind v4 + theme tokens + animations

src/components/
├── auth/
│   ├── auth-guard.tsx       # Client-side auth redirect
│   └── role-gate.tsx         # RBAC wrapper + AccessDenied
├── layout/
│   ├── app-layout.tsx       # Dashboard shell
│   ├── app-sidebar.tsx       # Collapsible sidebar
│   ├── header.tsx            # Top header
│   └── sidebar.tsx           # Shadcn sidebar base
├── metrics/
│   ├── metric-card.tsx        # MetricCard + ColorMetricCard
│   ├── page-header.tsx        # Page header with actions
│   └── section.tsx            # GlassCard, SectionHeader, StatusBadge
├── dashboard/
│   └── status-indicator.tsx   # Server/DB/Redis/MQTT status panel
├── notifications/
│   └── notification-panel.tsx
├── maps/
│   └── here-map.tsx           # Leaflet campus picker
├── theme-toggle.tsx           # 3-state theme switcher
└── ui/                        # 25 shadcn/ui components

src/lib/
├── api.ts                     # Complete API client (all endpoints)
├── user-profile.tsx           # UserProfileProvider context
├── institution.tsx             # InstitutionProvider context
├── use-in-view.ts            # Scroll-triggered reveal hook
├── utils.ts                   # cn() + format utilities
└── hooks/
    └── use-mobile.ts         # Mobile detection

src/middleware.ts              # Public route list, server-side redirect
```

---

## API Client (`src/lib/api.ts`)

All functions use `apiFetch()` which sets `credentials: "include"` and handles 401 → refresh → retry.

### Cancellation pattern

Every `apiFetch` (and report helpers like `getScreenTimeTrends` / `getClusterTrends` / `getDashboardSummary`) accepts an optional `AbortSignal` as the last argument. Pages must thread a per-effect `AbortController` so debounced search and on-mount fetches cancel cleanly on the next keystroke / unmount — without it, a slow first response arriving after a fast second one overwrites fresh data with stale results.

```ts
useEffect(() => {
  const ctrl = new AbortController();
  loadData(ctrl.signal);
  return () => ctrl.abort();
}, []);

async function loadData(signal?: AbortSignal) {
  try {
    const data = await apiFetch<T>("/api/...", { signal });
    setData(data);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return; // swallow cancellation
    toast.error("...");
  }
}
```

For debounced searches, create a new `AbortController` inside the `setTimeout` callback and abort on cleanup.

| Domain | Functions |
|--------|-----------|
| Auth | `getCurrentUser()`, `login()`, `logout()` |
| Students | `getStudents()`, `createStudent()`, `getStudentDetail()` |
| Reports | `getReport()`, `getScreenTimeTrends()`, `getClusterTrends()`, `getDashboardSummary()` |
| Models | `getModelHistory()`, `getLatestResult()`, `updateModelConfig()`, `triggerTraining()` |
| Campuses | `getCampuses()`, `createCampus()`, `updateCampus()`, `deleteCampus()` |
| Logs | `getLogs()`, `postLogs()`, `subscribeLogsStreamWebSocket()` (WebSocket primary) |
| Users | `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()`, `changePassword()` |
| ProgramStudi (round 5) | `getProgramStudi()`, `createProgramStudi()`, `updateProgramStudi()`, `deleteProgramStudi()` |
| LoginDevices (round 5) | `getLoginDevices()`, `revokeLoginDevice()` |
| System | `getSystemStatus()`, `getActiveUsers()` |
| AI | `chatWithAI()`, `getGroqModels()`, `getClusterContext()` |
| Seed | `getSeedStatus()`, `generateSeedData()`, `clearSeedData()` |
| Schedules | `getSchedules()`, `createScheduleRequest()` |

---

## Environment

```
NEXT_PUBLIC_API_URL=http://localhost:8000          # dev
NEXT_PUBLIC_API_URL=https://monitorterop.my.id    # production (set at build time)
```

---

## Next.js 16 Quirks

Read `AGENTS.md` before writing Next.js code — this version has breaking changes from earlier versions:
- Tailwind v4 uses CSS-based config, not JS
- `standalone` output mode for Docker
- `suppressHydrationWarning` on `<html>` for theme mismatch safety

---

## Build & Dev

```bash
npm install --legacy-peer-deps
npm run dev      # http://localhost:3000
npm run build    # standalone output in .next/
```

---

## Pages & Routes

| Route | Auth | Role | Notes |
|-------|------|------|-------|
| `/` | None | Public | Landing page with marketing content |
| `/login` | None | Public | Cookie-based login, ViewTransition morph, Google Drive app download link |
| `/register` | None | Public | Registration (mahasiswa/dosen only), Google Drive app download link |
| `/privacy` | None | Public | Privacy policy |
| `/dashboard` | Cookie | Admin/Dosen | Overview metrics |
| `/monitoring` | Cookie | Admin/Dosen | Server activity (WebSocket primary, SSE legacy) |
| `/students` | Cookie | Admin/Dosen | Student CRUD |
| `/reports` | Cookie | Admin/Dosen | Aggregate reports |
| `/ai` | Cookie | Admin/Dosen | Groq AI chat |
| `/models` | Cookie | Admin/Dosen | ML training + scatter plot |
| `/logs` | Cookie | Admin/Dosen | Real-time log viewer |
| `/profile` | Cookie | Any | Own profile |
| `/settings` | Cookie | Any | Notifications, institution |

---

## UI Quality Standards

Every page must have:

1. **Page header** — title + description + action buttons
2. **Loading state** — skeleton loaders for content areas
3. **Empty state** — meaningful message + action for empty lists
4. **Error state** — actionable error message with retry
5. **Responsive** — no horizontal scroll at 375px, 768px, 1280px
6. **Status feedback** — color + icon + text, never color alone
7. **Toasts** — sonner for async action feedback

---

## Fixed Issues

### 2026-09-26 — SPA Race + Cleanup
6 web fixes added `AbortController` + `AbortError` so debounced search and on-mount fetches cancel cleanly instead of letting stale responses overwrite fresh data.

1. **`apiFetch` AbortSignal support** — `src/lib/api.ts` now accepts a `signal` option, surfaces `DOMException` AbortError as a typed `AbortError` class (callers can detect without `instanceof DOMException`). Forwards the signal into `fetch()` so callers can cancel in-flight requests.
2. **`students/page.tsx` debounced search race** — fast typing could land stale data: a slow first response arriving after a fast second one would overwrite fresh results. Now the 400ms debounced `setTimeout` creates a per-fire `AbortController`, the cleanup function aborts in addition to `clearTimeout`. Both `[page, clusterFilter]` and `[search]` effects cancel stale fetches.
3. **`monitoring/page.tsx` mount fetch cleanup** — `loadStudents` now creates an AbortController in the useEffect and aborts on unmount; error handler swallows AbortError silently instead of toasting.
4. **`logs/page.tsx` mount fetch cleanup** — same pattern as monitoring.
5. **`dashboard/page.tsx` parallel fetches cleanup** — `Promise.allSettled([...])` now threads a single signal through all 6 fetches; mount useEffect aborts on unmount. Same `AbortError` swallow.
6. **`models/page.tsx` mount + cluster points cleanup** — `loadModels` and `loadClusterPoints` both accept an optional signal; the two mount effects create controllers and abort on unmount. Click handlers wrapped to `() => loadModels()` to preserve the new signal signature.
7. **`header.tsx` global search race** — debounced student autocomplete (220ms) used raw `fetch()` without signal — same race as students page. Now creates an AbortController per keystroke and aborts on the next keystroke or unmount.
8. **Extended report helpers** — `getScreenTimeTrends`, `getClusterTrends`, `getDashboardSummary` now accept optional `AbortSignal` and forward it into `apiFetch`. Dashboard's `Promise.allSettled` typed correctly afterwards.

### 2026-09-26 — User-reported bug fixes (9 issues)

1. **Profile saves to server** — `saveProfile()` in `profile/page.tsx` now calls `PUT /api/users/me` (added `updateMyProfile()` API helper). Old code only mutated local state.
2. **Camera button works** — Hidden `<input type="file">` opens on icon click, image read as base64, sent via `avatar_url`. Avatar renders when present.
3. **Role/username/studyProgram clarified as read-only** — Form labels them with `(read-only)` + helper text; only `fullName/email/phone` are editable (matches backend `ProfileUpdate`).
4. **Hardcoded session info replaced** — `navigator.userAgent` + `Intl.DateTimeFormat().resolvedOptions().timeZone`. Logout button actually logs out.
5. **Groq API key "not connected" race** — `handleSend` now falls back to `localStorage.getItem("groq_api_key")` when React state is empty (avoids the useEffect-after-mount race where state was empty but localStorage had the key). **Localstorage storage pattern preserved verbatim per user instruction.**
6. **Dosen role restriction** — `availableRoleOptions()` filters ROLE_OPTIONS to `["mahasiswa"]` for dosen. New endpoint `/api/users/create-student` lets dosen create mahasiswa accounts (server forces role); admin still uses `/api/users`.
7. **Same as #1** — Profile persistence fix.
8. **Student creation 500 → fixed** — `students.user_id` made nullable + `create_student` supports optional user account creation + new `/api/users/advisors` endpoint + dosen PA dropdown in frontend.
9. **Rekap cluster counts correct for any K** — Backend `build_row` now emits `Rendah/Sedang/Tinggi` regardless of cluster count (≤3 direct mapping, >3 bucketed into thirds by mean order). Original per-cluster keys preserved under `cluster_<id>_<label>`.

### 2026-09-26 — Round 4: editorial sweep + AI 500 + sidebar visibility

Eight production bugs + two new fixes reported after round-3 deploy. Most touch editorial discipline; AI 500 is server-side.

**Frontend (this repo):**

1. **Avatar appears in header** — `components/layout/header.tsx` added `<AvatarImage src={profile.avatarUrl} alt={profile.fullName} />` to both `<Avatar>` blocks; `<AvatarFallback>` stays underneath for SSR/hydration. Avatar shows uploaded photo when present, initials when absent.

2. **Dashboard greeting uses real username** — `app/(dashboard)/dashboard/page.tsx` calls `useUserProfile()` for cached name then falls back to `getCurrentUser()` on mount. Title is now `Selamat datang, Hary!` instead of hardcoded `Selamat datang, Admin!`. First name only.

3. **Metric cards: hairline-only (no per-card border, no coloured tint)** — `components/metrics/metric-card.tsx` dropped `editorial-panel` from the root `<div>` (the parent `gap-px bg-hairline` grid is the only separator). Applied to all 5 metric strips: `/dashboard`, `/students` (was `gap-4 grid` → now `gap-px bg-hairline`), `/models`, `/logs`, `/monitoring`, `/reports` (all `ColorMetricCard` → `MetricCard`, dropped `tint`/`pill` props). Numbered eyebrows `01–05` added to each strip for editorial consistency. `ColorMetricCard` component retained for legacy imports but no longer used by any page.

4. **PageHeader title no longer truncates** — `components/metrics/page-header.tsx:88` removed `truncate` and added `break-words` to the `<h1>`; fixed `leading-[1.05]` → `leading-[1.1]` so descenders aren't clipped. Long titles like "Selamat datang, Hary!" or "Pengaturan" no longer get cut off when right action buttons occupy horizontal space.

5. **Sidebar visibility when collapsed** — `components/layout/app-sidebar.tsx`: wordmark "M" was `text-ink/50` (50% opacity = invisible) → now `text-ink` at matching 11px size. Nav numbers when collapsed: `text-ink/35` → `text-ink/70` (regular), `text-primary` → `text-ink` font-bold (active) so active item stands out in solid black. Added `title` + `aria-label` on collapsed nav rows so hover shows the full menu name as tooltip. Toggle button bumped `text-ink/45` → `text-ink/55` for better contrast.

6. **Download popover editorial** — `components/ui/download-button.tsx` panel rewritten to paper bg + hairline dividers + numbered editorial rows (01 CSV, 02 Excel, 03 JSON, 04 PDF), no rounded corners, no coloured icon wells. `FORMAT_META` constant extracted for copy.

7. **Dashboard download functional when data empty** — `components/metrics/page-header.tsx` fallback Button now shows a sonner toast (`Data belum dimuat, coba lagi`) instead of an inert button.

8. **Profile page editorial** — `app/(dashboard)/profile/page.tsx` replaced `bg-ink/[0.03] mx-5 px-5 py-5` inner panels with `px-6 py-6 border-t border-hairline`; numbered eyebrows `01–05` on all five sections (Foto & Identitas, Informasi Akun, Ubah Kata Sandi, Sesi Login, Preferensi Notifikasi).

9. **Footer dark mode readable** — `app/_components/landing-view.tsx` replaced all `text-paper/*` utilities (which collapse to dark-on-dark when `--paper` flips in dark mode) with new `text-on-section-ink/*` utilities in `globals.css` that hardcode `oklch(0.96 0.004 80 / 0.X)` — light cream text on the dark `bg-section-ink` slab regardless of theme.

10. **Imato underline dropped** — `globals.css` removed `.cycle-imato::after` and `@keyframes cycleImatoUnderline`. Colour shift + GORONTALO eyebrow label preserved per user instruction. `prefers-reduced-motion` block cleaned up.

11. **Privacy page editorial + expanded** — `app/privacy/page.tsx` fully rewritten with editorial UI (eyebrow caps + display-serif headlines, hairline rules, numbered sections 00–10, `editorial-cta` button) + expanded content: TL;DR summary, 10 sections covering data collected / storage / purpose / RBAC table / cookie matrix / notifikasi / hak Anda per UU PDP 2022 / deletion methods (self-service + email) / perubahan kebijakan / kontak. Localstorage Groq API key storage pattern in `/ai/page.tsx` untouched (constraint preserved verbatim per prior instruction).

**Backend fixes** (in `server/CLAUDE.md`): AI 500 from `func.max()` naive label (`cast(func.max(...), AwareDateTime)`); `_IDENT_RE` NameError fixed by hoisting to module scope (`database.py:19`) so all three migration functions can share it.

### 2026-09-26 — Round 5: ProgramStudi dropdown + LoginDevice list + role badges + editorial cleanup

Ten production bugs reported by user after round-4 deploy. Backend adds two new tables + four new endpoints + a serializer bug fix (see `server/CLAUDE.md`). Frontend changes below.

**Frontend (this repo):**

1. **Role pill per user row in Kelola Akun** — new `RolePill` component in `app/(dashboard)/settings/page.tsx` maps `admin` → fuchsia dot `bg-[oklch(0.55_0.22_340)]` + `ADMIN` label, `dosen` → primary blue + `DOSEN`, `mahasiswa` → ink/45 + `MAHASISWA`. Hairline border + uppercase JetBrains-Mono label, no fill. Each row in the `UsersTable` now leads with `<RolePill>` so the privilege tier is obvious without scanning Jabatan or Status. Okabe-Ito palette preserved (admin = destructive token, dosen = brand primary, mahasiswa = neutral ink). The `RolePill` is intentionally placed *before* the avatar/name, not after — when scanning a long list, the eye lands on the colored dot first and the privilege tier is the highest-signal piece of info.

2. **Jurusan dropdown replaces free-text input** — `app/(dashboard)/settings/page.tsx` replaced the `<input>` for `jurusan` in the user-form dialog with a `<select>` populated from `GET /api/program-studi`. The last option is `"+ Tambah Prodi Baru"` which opens a nested `Dialog` with `code` + `name` + `description` fields; on submit it calls `POST /api/program-studi` then refreshes the dropdown. Eliminates "Informatika" / "Teknik Informatika" / "IF" duplicates. The dialog uses `editorial-input` (bottom-border only, no fill, no rounding) — matches the rest of the dashboard chrome.

3. **AccessDenied full editorial rewrite** — `components/auth/role-gate.tsx` was legacy `glass-card` + amber-100/violet-100 colored wells. Rewritten to editorial primitives: `editorial-panel animate-fade-up` container, numbered eyebrow `00 · Akses Terbatas`, `display-sans text-2xl` heading (Montserrat 800), square (2px) icons on paper bg + hairline border (no amber/violet fill), three-item numbered hint list (01 Gunakan Aplikasi Mobile / 02 Hubungi Dosen PA / 03 Hubungi Admin Prodi), `editorial-cta` (primary) + `editorial-ghost` (secondary) buttons. No em-dashes anywhere in copy.

4. **Profile Sesi Login: list of all devices, deduped** — `app/(dashboard)/profile/page.tsx` Sesi Login section now loads from `GET /api/auth/devices` instead of the single hardcoded `navigator.userAgent` row. Each row shows `device_name` + `user_agent` + relative `last_seen` (computed client-side from `Intl.RelativeTimeFormat` with `Baru saja` / `X menit lalu` / `X jam lalu` buckets) + absolute `first_seen`. The current device shows a `Perangkat ini` badge; other rows get a `Cabut` button → `DELETE /api/auth/devices/{id}`. Skeleton loader + empty state ("Belum ada perangkat tercatat") preserved.

5. **Models page: cluster labels reactive to K count** — `app/(dashboard)/models/page.tsx` cluster label inputs now derive from `Array.from({ length: kClusters }, (_, i) => activeModel.cluster_labels?.[String(i)] ?? 'Klaster ' + (i+1))` instead of `Object.entries(activeModel.cluster_labels)`. Picking K=4 from K=3 immediately renders the new fourth input ("Klaster 4") instead of waiting for save+reload. Save now sends a clean `[0..K-1]` map (strips stale entries from previous larger K). Each input has a `(i+1).padStart(2, "0") · Klaster ${i+1}` eyebrow for editorial consistency.

6. **Models chrome editorial** — replaced `bg-ink/[0.03] mx-5 px-5 py-5` panels with `px-6 py-6 border-t border-hairline`; numbered eyebrows (01 Parameter ML, 02 Indikator Fitur, 03 Label Klaster) added to each section for consistency with `/profile` and `/settings`. K-Means K-slider, label inputs, history table, preview scatter all wrapped consistently. K label inputs use `editorial-input`.

7. **Profile Informasi Akun editorial** — same `bg-ink/[0.03] mx-5 px-5 py-5` → `px-6 py-6 border-t border-hairline` swap. Numbered eyebrow `02` on the Informasi Akun panel for parity with the new round-5 Profile layout.

8. **Em-dash sweep across web** — replaced 4 visible em-dashes in `app/(dashboard)/settings/page.tsx` (ROLE_DESCRIPTIONS, Identitas sub, Atur titik GPS sub, "catat dan sampaikan" copy) with commas. `app/_components/landing-view.tsx:1098` (the "tautan ke dokumentasi resminya" sentence) replaced em-dash with comma. Tightened Fitur section copy to mention "tanpa mengkategorikan secara prematur".

9. **Landing page Chinese characters** — none remained after grep (verified by stripping HTML/script/style tags and counting `[一-鿿]`). Hero / Fitur / Cara Kerja / Sistem / Kontributor sections reviewed for editorial consistency. Tightened important copy in the Hero + Fitur blocks per user instruction ("update informasi penting namun umum").

**API helpers added in `src/lib/api.ts`:**

- `getProgramStudi(include_inactive?, signal?)` → `GET /api/program-studi`
- `createProgramStudi({code, name, description?}, signal?)` → `POST /api/program-studi`
- `updateProgramStudi(id, {...}, signal?)` → `PUT /api/program-studi/{id}`
- `deleteProgramStudi(id, signal?)` → `DELETE /api/program-studi/{id}`
- `getLoginDevices(signal?)` → `GET /api/auth/devices`
- `revokeLoginDevice(deviceId, signal?)` → `DELETE /api/auth/devices/{deviceId}`
- `login()` helper extended to compute `device_id` via `crypto.subtle.digest("SHA-256", ...)` over `navigator.userAgent + screen.width + "x" + screen.height + Intl.DateTimeFormat().resolvedOptions().timeZone`, parse `device_name` from `navigator.userAgent`, send all three fields in the request body. Falls back to a substring of the parts if `crypto.subtle` is unavailable (older browsers, no HTTPS).

**Verified post-deploy:**

- `POST /api/program-studi` (admin) → 201, body `{id, code, name, description, is_active, created_at}`
- `GET /api/program-studi` → 200 with the row(s)
- Login → `POST /api/auth/login` with `device_id="testbrowser123"`, second login from same `device_id` → upserts (same row, `last_seen` updated); second login from a new `device_id="testbrowser456"` → 2 rows total
- `DELETE /api/auth/devices/{id}` → 204
- Landing page contains 0 visible em-dashes and 0 Chinese chars (verified)
- Login / settings / profile / models / privacy / landing → all `HTTP 200`
- Groq API key localStorage storage pattern in `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback in `handleSend` all preserved verbatim per the standing user constraint.

### 2026-09-27 — Round 7: Akademik tab + reports detail + UI/UX polish + register fix

User-pasted 13-item bug-and-feature list. All items addressed.

**Frontend (this repo):**

1. **Settings → new Akademik tab** (`04 · Kursus & Jadwal`) in `app/(dashboard)/settings/page.tsx`. Three GlassCard panels with hairline dividers:
   - **Mata Kuliah CRUD** — code / name / sks / semester / program_studi_id / description. Prodi dropdown sourced from `getProgramStudi()` (filters `is_active` true). Soft-delete via `is_active=false`.
   - **Jadwal Mata Kuliah CRUD** — day-of-week select (Senin–Minggu, 1–7) / time pickers / room. Schema-side `_parse_hhmm` validator on backend.
   - **Antrian Permintaan Akademik** — review queue with `Setujui` / `Tolak` buttons (uses `prompt()` for review notes), inline status dot + uppercase label using `text-warning`/`text-success`/`text-destructive` (no filled pills), delete button.
   All async fetches AbortController-managed (one `ctrl.signal` threaded through `Promise.all`). Status uses Okabe-Ito dots per CLAUDE.md semantic-status rule.

2. **Reports page detail table** — `app/(dashboard)/reports/page.tsx`:
   - Daily recap: 14 days, weekly: 4 weeks, monthly: 3 months. `CHART_LIMIT` 7/4/3 + `DETAIL_LIMIT` 14/4/3.
   - Separate `detailTrends` state and fetch (different periods from the chart).
   - `tableData` now reads from `detailTrends`.
   - BarChart taller (220 → 260px), Okabe-Ito palette per series, numbered eyebrows per period.
   - Em-dashes replaced with `kosong` everywhere (period column + cluster columns).
   - Removed unused `Calendar`, `Badge` imports and `tooltipStyle` variable.

3. **DownloadButton editorial + auto-close fix** — `components/ui/download-button.tsx`:
   - Default Button className now `h-8 gap-1.5 text-xs rounded-none border-hairline bg-transparent hover:border-ink hover:bg-transparent`.
   - `DownloadBlurBackdrop` made `pointer-events-none` so it doesn't intercept clicks (was causing the dropdown to auto-close — the backdrop ate the outside-click event before shadcn's `onInteractOutside` could fire).
   - `DropdownMenuContent` given explicit `z-50`.
   - Glass `backdrop-blur-sm` and `rounded-xl` removed (editorial rule).

4. **Models page `bg-section-amber` → `bg-paper`** (7 sites) — `bg-section-*` tints belong on landing chrome only, not the dashboard.

5. **Models page "03 Label Klaster" 2-col span** — `lg:col-span-2` + custom header `display-sans text-2xl tabular-nums text-primary` for the section number + `display-sans-black text-2xl sm:text-3xl` for the title (matching the SAIC editorial reference).

6. **Models page "Preview Konfigurasi Aktif" hairline 4-cell summary** — PCA Components, K-Means K, Silhouette, Dataset. Numbered eyebrows `01–04`.

7. **Settings → removed "Logo Institusi" block** entirely (UI + `pickLogo` / `clearLogo` / `readLogoFile` / `logoDataUrl` / `logoBusy` / `fileInputRef` state + imports).

8. **Register page → prodi dropdown** — `app/register/page.tsx`: replaced `<input>` for prodi with `<select>` populated from `getProgramStudi()`. Trailing `"+ Tambah Prodi Baru"` opens a nested Dialog (code + name + description) → `createProgramStudi()`. Aligns with the round-5 master list (eliminates "Informatika" / "Teknik Informatika" / "IF" duplicates).

9. **Register page → password min 8 chars** — was 6, now 8. Aligns with the round-5 backend `PasswordChange` validator (`_validate_password_strength` helper). Placeholder "Min. 8 karakter" + error message updated.

10. **Register page → FastAPI array detail handling** — FastAPI's 422 detail is `[{loc, msg, type}]` (array), not a string. The previous `data?.detail` toast handler treated it as a string and rendered the page unbootable. Added `Array.isArray(data?.detail)` branch that joins `.msg` fields with `, `, falls back to `"Validasi gagal"` if no `.msg` strings are present.

11. **One stray Chinese character removed** — `models/page.tsx:979` sub label `Record训练` → `Total record`. 0 CJK chars remaining in web (verified by Python regex sweep).

12. **API helper fix** — `getProgramStudi(includeInactive = false, signal?: AbortSignal)` now accepts an optional `AbortSignal` second arg (round-5 missed it; needed for the Akademik tab's parallel fetch). `InstitutionProfile.logoDataUrl` made optional so `setProfile({...})` doesn't reject partial updates after the logo UI was removed.

13. **`<section>` mismatch fix** — `models/page.tsx:1072` had `</div>` where `</section>` was needed (leftover from earlier round). `npx tsc --noEmit` clean afterwards.

**API helpers added in `src/lib/api.ts`:**

- `getMataKuliah({program_studi_id?, include_inactive?}, signal?)` → `GET /api/mata-kuliah`
- `createMataKuliah({code, name, sks?, semester?, program_studi_id?, dosen_id?, description?}, signal?)` → `POST /api/mata-kuliah`
- `updateMataKuliah(id, {...}, signal?)` → `PUT /api/mata-kuliah/{id}`
- `deleteMataKuliah(id, signal?)` → `DELETE /api/mata-kuliah/{id}`
- `getJadwalMataKuliah({mata_kuliah_id?, include_inactive?}, signal?)` → `GET /api/jadwal-mata-kuliah`
- `createJadwalMataKuliah({mata_kuliah_id, day_of_week, start_time, end_time, room?}, signal?)` → `POST /api/jadwal-mata-kuliah`
- `updateJadwalMataKuliah(id, {...}, signal?)` → `PUT /api/jadwal-mata-kuliah/{id}`
- `deleteJadwalMataKuliah(id, signal?)` → `DELETE /api/jadwal-mata-kuliah/{id}`
- `getRequestAkademik({status?}, signal?)` → `GET /api/request-akademik`
- `createRequestAkademik({type, name, description?, payload?, target_id?}, signal?)` → `POST /api/request-akademik`
- `reviewRequestAkademik(id, "approved"|"rejected", review_notes?, signal?)` → `PUT /api/request-akademik/{id}/review`
- `deleteRequestAkademik(id, signal?)` → `DELETE /api/request-akademik/{id}`

**Verified post-deploy:**

- `POST /api/mata-kuliah` (admin) → 201 with the row; `GET /api/mata-kuliah` → 200 with the row.
- `POST /api/jadwal-mata-kuliah` → 201 with HH:MM times; subsequent `GET` includes it.
- `POST /api/request-akademik` (any auth) → 201, row returned; `PUT /api/request-akademik/{id}/review` → 200 with `status="approved"` and `review_notes` recorded.
- `PUT /api/mata-kuliah/{id}` (`is_active=false`) → 200; subsequent `GET /api/mata-kuliah?include_inactive=true` shows inactive row.
- All web pages return `200` (home / login / register).
- `npx tsc --noEmit` clean.
- 0 CJK chars in web (regex sweep over `.tsx/.ts/.css/.md/.html`).
- Groq API key localStorage storage pattern in `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback in `handleSend` all preserved verbatim per the standing user constraint.

### 2026-09-27 — Round 9: UI/UX softening + Profile data sync + Em-dash sweep

User-pasted feedback that the editorial UI felt **kaku** (rigid) due to flat 1px hairlines and bare `bg-paper` cards. Asked for subtle shadows as separators, comfort improvements that preserve the editorial theme, profile data to match the actual logged-in account, full em-dash sweep per KBBI (Bahasa Indonesia), and CJK check. Landing/login/register pages left untouched per instruction.

**Frontend (this repo):**

1. **Softened hairline token + new shadow utilities** — `globals.css`:
   - `--hairline`: `oklch(0.86)` → `oklch(0.91)` so card edges almost disappear (the structural line is now an undertone, not a rule).
   - New `--hairline-soft: oklch(0.93)` for in-card divisions (table rows, list items).
   - New warm shadow tokens: `--shadow-card` (1px tight + 14px ambient), `--shadow-card-hover`, `--shadow-panel`. All use ink-tinted oklch so they read as paper above paper.
   - New utility classes: `.lift-1` (default card shadow + hover lift), `.lift-2` (panel — used by header popover), `.lift-3` (floating controls — used by notification panel), `.divider-soft` (table rows), `.row-hover` (warmer hover than `bg-ink/[0.02]`).

2. **`GlassCard` now floats** — `components/metrics/section.tsx`. Replaced the old flat editorial-panel with `.lift-1` so every GlassCard across the dashboard gets the warm drop shadow by default. Hover deepens it. Replaces the previous "flat hairline card" pattern that read as rigid. The card itself loses its border (parent `gap-px bg-hairline` or `.lift-1` is the only separator).

3. **`SectionHeader` gets an inset highlight** — same file. The 1px line `bg-ink/[0.04]` at the top replaces the old `border-t border-hairline` between header and body. Reads as "label pressed into paper" instead of "thick divider".

4. **`MetricCard` hover lift** — `components/metrics/metric-card.tsx`. Adds an inset highlight + ambient shadow on hover so cards press against each other when the cursor moves over them. Used to be flat.

5. **Notification panel softer dividers + lift-3** — `components/notifications/notification-panel.tsx`. Popover uses `.lift-3` (heavy floating shadow); row dividers use `.divider-soft`; section headers ("Aktivitas Server" / "Aktivitas User") use a 1.5% ink tint as a quieter background instead of a border; hover state uses `.row-hover` instead of the flat `hover:bg-ink/[0.02]`.

6. **5 in-card body borders removed from profile page** — `app/(dashboard)/profile/page.tsx`. The previous `px-6 py-6 border-t border-hairline` after each SectionHeader became redundant once the SectionHeader has its own inset highlight. Removed 5 of these across Foto & Identitas, Informasi Akun, Ubah Kata Sandi, Sesi Login, and Preferensi Notifikasi cards.

7. **Profile Faculty field now reads real data** — same file. User model only exposes `jurusan`, not `fakultas`. The Faculty input now renders `profile.studyProgram` (the cached `jurusan` value) read-only with helper text "Diturunkan dari Program Studi / Jurusan yang terdaftar pada akun Anda." Role pill and Faculty pill both fall back to `profile.studyProgram` or `"—"` (now `kosong`) instead of the static default. The form mirrors what's actually persisted on the server.

8. **Profile Sesi Login softer list** — same file. Device list rows use `.row-hover` and `.divider-soft`; skeletons use `bg-ink/[0.015]` instead of pure hairline borders.

9. **DownloadButton PDF cells no longer show em-dash** — `components/ui/download-button.tsx`. The Excel/PDF `escapeHtml(String(val ?? "—"))` placeholder changed to `""` so empty cells don't render as `—` in exported files.

10. **Em-dash sweep (UI-visible only)** — 19 files touched. Python scanner (`/tmp/find_em.py`) strips JS/TS comments before scanning for em-dashes in quoted strings or JSX text. Replaced:
    - Sentence-level em-dashes with comma (`"Sebaran mahasiswa per klaster — 4 minggu terakhir"` → `"Sebaran mahasiswa per klaster, 4 minggu terakhir"`, plus the AI page's "Groq — tidak melewati server" → "Groq, tidak melewati server").
    - Standalone placeholder em-dashes (`"—"`) used as empty values → `"kosong"` for human-facing strings; `""` for the PDF/CSV export cells.
    - Files affected: `dashboard/page.tsx`, `models/page.tsx`, `students/page.tsx`, `logs/page.tsx`, `monitoring/page.tsx`, `profile/page.tsx`, `ai/page.tsx`, `metrics/cluster-badge.tsx`, `ui/download-button.tsx`.
    - **CJK scan**: 0 Chinese/Japanese/Korean characters in web source (regex sweep over `.tsx/.ts/.css/.md/.html`).

11. **Sections / dividers / shadow conventions are now reusable** — the `.lift-*`, `.divider-soft`, `.row-hover` utilities and the new shadow tokens mean future agents can pick a level of "lift" for new components without inventing new shadow stacks. Default for cards: `.lift-1`. For floating panels (popover, dialog, header dropdown): `.lift-2` or `.lift-3`. For table rows and list dividers inside a card: `border-b divider-soft`.

**Verified post-deploy:**

- `npx tsc --noEmit` → exit 0
- `npx next build` → all 16 routes prerender successfully
- 0 CJK chars in web (regex sweep)
- 0 visible em-dashes (Python scan after stripping comments)
- Groq API key localStorage storage pattern in `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback in `handleSend` all preserved verbatim per the standing user constraint.

**Android sync** — dispatched the `android` agent in the background with a prompt to add a 3-step Fakultas → Jurusan → Program Studi cascade picker wherever the Android app currently lets the user pick a program studi (login profile, registration, dosen affiliation). Will be merged in once the agent reports back. Backend already exposes `GET /api/fakultas`, `GET /api/jurusan?fakultas_id=`, `GET /api/program-studi?jurusan_id=` — DTOs already added in `monitor-ung-app/app/src/main/java/com/monitorung/app/data/remote/{dto,api}/`.

## Round 9.5 — MetricCard + Sidebar polish, mobile sidebar wiring

User feedback: MetricCard dan Sidebar juga butuh revisi UI yang sama (subtle shadow sebagai pembatas, hairline tetap sebagai pemisah). Sidebar mobile belum fix — hamburger di header tidak membuka sheet yang benar.

### MetricCard polish

12. **`MetricCard` switched from inline `hover:shadow-[...]` to `.lift-1` utility** (`components/metrics/metric-card.tsx:50`). The inline `box-shadow: inset(...) + drop(...)` worked but wasn't shareable with other surfaces. `.lift-1` is now consistent with the other paper-against-paper surfaces (GlassCard, SectionHeader, popovers). Hairline grid stays as the primary divider between cards; the shadow is the lift that prevents the cards from looking pasted on the page.

### Sidebar polish

13. **`AppSidebar` now carries `--shadow-panel` shadow** (`components/layout/app-sidebar.tsx:107`). The hairline border remains as the editorial divider on the right edge; the shadow softens the visual weight of the full-height sidebar so it doesn't feel pasted against the page content. On the collapsed (icon) state the shadow is preserved.

14. **Active nav row gets a tinted background** (`components/layout/app-sidebar.tsx:174-189`). Previously the active row was marked only with a left border accent; now it also gets `bg-primary/[0.04]` — a 4% ink-tinted fill — so the row reads as "selected paper" rather than just "row with a bar". The hover row uses the same `hover:bg-ink/[0.03]` as before.

### Mobile sidebar wiring fix (the actual bug)

15. **Header hamburger was rendering a SECOND `<AppSidebar />` instance** inside a separate `<Sheet>` wrapper (`components/layout/header.tsx:174-189` before fix). Clicking the hamburger opened that internal Sheet copy instead of the provider's mobile sheet. The internal copy had no knowledge of the outer sidebar context, so:
    - Clicking the hamburger inside the Sheet copy toggled state inside the copy, not the provider.
    - Tapping a nav item did NOT close the Sheet (no `onClick` wired to `setOpenMobile`).
    - Two `<AppSidebar />` instances were mounted simultaneously — wasteful and a source of focus-trap confusion.
    **Fix:** replaced the custom `<Sheet><SheetTrigger>...<AppSidebar /></SheetContent></Sheet>` block with the shadcn `<SidebarTrigger>` from `@/components/ui/sidebar` (line 178). `SidebarTrigger` reads `toggleSidebar()` from `useSidebar()` context; that function is already wired to `isMobile ? setOpenMobile : setOpen`, so mobile opens the provider's mobile sheet — one source of truth, no duplicate sidebar mount. The new `<SidebarTrigger>` keeps the `md:hidden` class so it only shows on mobile (desktop uses the in-sidebar hamburger from `app-sidebar.tsx`).

16. **Mobile nav links now close the Sheet on tap** (`components/layout/app-sidebar.tsx:174-178`). Destructured `setOpenMobile` from `useSidebar()` and added an `onClick` handler that calls `setOpenMobile(false)` when `isMobile` is true. Without this, the user has to dismiss the sheet manually after navigating — on small screens that's a one-second drag to dismiss a full-height overlay every tap.

### Verified

- `npx tsc --noEmit` → exit 0
- `npx next build` → 16 routes prerender successfully; new BUILD_ID `PZO1ijd6HQcY6yWz_P7h1`
- Production web rebuilt + force-recreated; CSS bundle contains `lift-1`, `lift-2`, `lift-3`, `divider-soft`, `hairline-soft`, `shadow-panel` (grep over `/workspace/.next/static/chunks/*.css` after deploy)
- Mobile Sheet and desktop collapse both wired to the single `useSidebar()` context — no duplicate sidebar mount

## Round 10 — Header mobile polish, dropdown hover grace, registration fix, Changelog landing, privacy UUD

User feedback batch: header pada mobile terlalu rapat, animasi kata "monitor" di hero menggeser layout saat kata Imato muncul, dropdown desktop header terlalu sensitif (langsung hilang saat kursor turun perlahan ke popover), JWT access token 60 menit terlalu panjang, bug 3 detik pada halaman pendaftaran yang tiba-tiba redirect ke /login, label MHS yang seharusnya Mahasiswa, indikator hardcode, badge ML config belum editorial, dan permintaan menambah section Changelog + rujukan UUD di kebijakan privasi.

**Backend (`server/`):**

1. **JWT access token lifetime dipendekkan dari 60 ke 30 menit** (`server/app/config.py`). Masa hidup yang lebih pendek memperkecil window paparan token yang dicuri; refresh token tetap 7 hari sehingga sesi panjang tidak terputus. Perubahan ini memberi alasan form register dapat me-reload prodi tanpa login.

2. **Endpoint GET /api/program-studi dibuka untuk publik** (`server/app/routers/program_studi.py`). Sebelumnya endpoint ini memerlukan autentikasi, sehingga halaman `/register` yang memanggil `getProgramStudi()` sebelum login memicu `apiFetch 401 → refresh failed → window.location.href = "/login"` tepat 3 detik setelah halaman dibuka (race dengan debounce search). Sekarang endpoint tetap memerlukan auth untuk method tulis (POST/PUT/DELETE), hanya method GET yang publik untuk kebutuhan dropdown pendaftaran.

**Frontend (`website/`):**

3. **Hero layout shift diperbaiki dengan invisible slot** (`website/src/app/_components/landing-view.tsx`). Komponen `CyclingWord` sekarang merender salah satu dari dua kondisi: `<span class="cycle-imato-label">` saat kata Imato aktif (visible), atau `<span class="cycle-imato-label-slot">` saat kata lain aktif (transparan dengan `min-height: 1em`). Tinggi h1 tidak pernah berubah; hanya label Gorontalo di bawahnya yang muncul saat waktunya. Class `.cycle-imato-label-slot` ditambahkan ke `globals.css` dengan `color: transparent; user-select: none; pointer-events: none`.

4. **CyclingFont tempo disinkronkan ke 2000ms** (`website/src/app/_components/landing-view.tsx`). Sebelumnya animasi font UNG menggunakan interval sendiri yang sedikit berbeda dengan CyclingWord. Sekarang keduanya berbagi tempo 2 detik sehingga perubahan font "ung" selalu sinkron dengan perubahan kata "monitor". Font yang dirotasi: Montserrat, Fraunces, Inter, Space Grotesk, JetBrains Mono (bergantian melalui dokumen font, mengikuti dokumen editorial SAIC).

5. **NavDropdown desktop header sekarang tahan kursor** (`website/src/app/_components/landing-view.tsx`). Pola hover lama langsung menutup dropdown saat kursor meninggalkan trigger wrapper, sehingga kursor yang turun perlahan ke panel membuat dropdown menghilang. Sekarang ada grace period 140ms: `onMouseLeave` menjadwalkan `setOpen(false)` via `setTimeout`, dan baik wrapper maupun panel punya `onMouseEnter` yang membatalkan timer. Hasil: kursor bisa menyeberang diagonal dari trigger ke panel tanpa popover menutup.

6. **Header mobile dirapikan** (`website/src/components/layout/header.tsx`). Padding & gap sekarang responsif: `gap-3 sm:gap-6 px-3 sm:px-6`. Search input center di-hidden pada mobile (`hidden md:flex`) sehingga row header tetap breathable; pada mobile hanya brand + hamburger + actions yang tampil.

7. **Penulisan MHS diganti Mahasiswa di seluruh dashboard** — 5 file: `reports/page.tsx`, `monitoring/page.tsx`, `dashboard/page.tsx`, dan label metrik terkait. Termasuk label "Mhs Terhubung" → "Mahasiswa Terhubung", "Mhs Aktif Mobile" → "Mahasiswa Aktif Mobile", "Mhs Pending" → "Mahasiswa Pending", "Avg Score" → "Rerata Skor", "Avg Screen Time" → "Rerata Screen Time".

8. **Badge ML config diganti editorial** (`website/src/app/(dashboard)/models/page.tsx`). Sebelumnya `{pcaComponents}` dan `{kClusters}` dibungkus `<Badge variant="outline" className="font-mono">`; sekarang menjadi `<span className="inline-flex items-baseline gap-2">` dengan eyebrow `Nilai` dan angka tabular-nums. Editorial konsisten dengan remainder dashboard.

9. **Status koneksi real-time/ML berganti bahasa** (`website/src/app/(dashboard)/models/page.tsx`). `"Connected"` → `"Terhubung"`, `"Offline"` → `"Terputus"`.

10. **Sidebar hardcoded `recentActivity` dikosongkan** (`website/src/components/layout/app-sidebar.tsx`). Daftar hardcoded "X menit lalu" adalah peninggalan prototype awal; dasbor sekarang punya real-time feed `/api/logs/stream/ws` (WebSocket) yang rencana di-wire ke sidebar. Sementara itu, widget menampilkan empty state copy netral.

11. **Deskripsi peran Dosen PA pada halaman pendaftaran** (`website/src/app/register/page.tsx`). Dari `"Lihat mahasiswa bimbingan Anda dan analisis perilaku belajar"` menjadi `"Daftar dosen untuk mengecek mahasiswa"` per permintaan eksplisit user.

12. **Section Changelog di landing page** (`website/src/app/_components/landing-view.tsx`). Section baru `#changelog` antara Kontributor dan Footer dengan empat kanal terpisah (Server, ML, Website, Android). Setiap kanal adalah grid item dengan daftar versi (versi + tanggal + sorotan + butir perubahan). Setiap butir memiliki label kind dengan dot warna Okabe-Ito: Baru (success/teal), Perbaikan (primary/biru), Perubahan (warning/amber), Dihapus (destructive/fuchsia). Versi pertama otomatis terbuka; pengguna bisa memperluas versi lain dengan mengklik tombol accordion.

13. **Rujukan UUD di Kebijakan Privasi** (`website/src/app/privacy/page.tsx`). Section baru "0A / Dasar hukum & rujukan regulasi" dengan daftar 5 peraturan:
    - UU PDP No. 27 Tahun 2022 (Undang-Undang Pelindungan Data Pribadi) — peraturan.bpk.go.id
    - UUD 1945 Pasal 28F (Hak atas informasi & komunikasi) — mkri.id
    - UUD 1945 Pasal 28G (Hak atas perlindungan diri) — mkri.id
    - Permendikbud No. 20 Tahun 2018 (Penguatan Pendidikan Karakter)
    - UU ITE No. 19 Tahun 2016 (Informasi & Transaksi Elektronik)
    Tiap pranala mengarah ke PDF resmi di peraturan.bpk.go.id atau mkri.id. Komponen `LawRow` editorial menggunakan hairline dividers + monospace label lebar tetap + display-sans title + hover state. Section number "00" yang sudah dipakai Ringkasan dipindah ke "0A" agar tidak duplikat.

14. **Em-dash sweep akhir** — Python scanner `/tmp/scan_em2.py` memindai seluruh `website/src` setelah menghapus semua komentar (block + line). Hasil: 0 em-dash yang tersisa di kode aktif (string atau JSX text). Em-dash di komentar dokumentasi tidak disentuh.

15. **CJK sweep** — Python scanner memindai semua file `.tsx/.ts/.css/.md/.html/.js` untuk karakter CJK Unified Ideographs, Hiragana, Katakana, dan Hangul. Hasil: 0 temuan di web. Sebelumnya satu karakter Mandarin `Record训练` di `models/page.tsx:979` sudah diganti `Total record` di Round 7.

**Verified post-deploy:**

- `npx tsc --noEmit` → exit 0
- `npx next build` → 16 routes prerender successfully
- 0 em-dash user-visible di website (Python scan)
- 0 CJK characters di website (Python scan)
- Bug 3 detik register redirect hilang: halaman `/register` bisa memuat dropdown prodi tanpa redirect ke `/login`
- Header mobile breathing-room lega di 375px viewport
- NavDropdown hover grace: kursor turun perlahan ke panel tidak menutup dropdown
- Hero CyclingFont + CyclingWord sinkron di tempo 2 detik
- Groq API key localStorage storage pattern di `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback di `handleSend` semua dipertahankan verbatim per standing user constraint

## Round 11 — Header auth + trio rerata harian + Changelog berdiri sendiri

User feedback batch: login dan register tidak punya top header; tambah rerata unlock count, rerata waktu sosmed, rerata waktu game di monitoring; sinkronkan ke reports + dashboard; pindahkan Changelog ke page tersendiri; lulus KBBI/em-dash sweep; deploy.

### Frontend (this repo)

1. **Header editorial di `/login` + `/register`** (desktop) — kedua halaman sekarang punya top bar 64 px dengan brand wordmark di kiri dan link "Beranda" di kanan (mirror privacy page header). Hidden di mobile (`hidden lg:flex`) karena mobile sudah punya top bar sendiri. Inline logo UNG + display-sans "Monitor UNG" + eyebrow "Universitas Negeri Gorontalo" konsisten dengan halaman publik lainnya.

2. **Trio rerata di `/monitoring`** — tambah tiga `MetricCard` baru (Rerata Unlock Count, Rerata Sosmed, Rerata Game) dengan icon `KeyRound` / `MessageCircle` / `Gamepad2` (lucide). Field `MonitoringStudent` interface diperluas dengan `avgUnlockCount`, `avgSocialMediaTime`, `avgGameTime`; real-time handler (WebSocket primary, SSE legacy) populate dari `event.unlock_count` / `event.social_media_time_minutes` / `event.game_time_minutes`. Grid `lg:grid-cols-3` → `lg:grid-cols-4` (8 cards = 2 rows × 4 cols). DownloadButton CSV/Excel/PDF sekarang mengekspor tiga kolom rerata baru.

3. **Trio rerata di `/reports`** — tambah baris kedua tiga `MetricCard` (Rerata Unlock Count, Rerata Sosmed, Rerata Game) plus satu kartu catatan penjelasan di baris yang sama. Total metric strip sekarang 4 + 4 = 8 cards. Bind ke `reportData.avg_unlock_count`, `reportData.avg_social_media_time`, `reportData.avg_game_time`. DownloadButton export tiga kolom baru.

4. **Rerata Unlock di `/dashboard`** — tambah satu `MetricCard` "Rerata Unlock Count" di metric strip utama (ringkasan cepat saat dashboard pertama dimuat). `ReportData` interface diperluas dengan dua field (`avg_social_media_time`, `avg_game_time`) untuk konsistensi tipe. Grid `lg:grid-cols-3` → `lg:grid-cols-4` (6 cards).

5. **`/changelog` page berdiri sendiri** — section Changelog dari landing dipindahkan ke `src/app/changelog/page.tsx`. Mirror struktur privacy page: top bar dengan brand + Beranda, eyebrow "01 / Catatan Pengembangan", display-sans title "Changelog per kanal", meta strip 4 sel (Kanal / Versi terakhir / Pembaruan / Format), body dengan 4 channel blocks accordion-style, footer dengan copyright + ThemeToggle. Data Changelog direlokasi ke `_components/_data.ts` agar bisa dibagikan dengan widget ringkasan di masa depan. Export `CHANGELOG`, `KIND_DOT`, `KIND_LABEL` dari `_data.ts`; `_components/changelog-list.tsx` (client component) render 4 channel sebagai grid `lg:grid-cols-2`.

6. **Landing dibersihkan** — `_components/landing-view.tsx`: seluruh blok data Changelog (CHANGELOG const + types + KIND_LABEL + KIND_DOT) dihapus; `ChangelogSection` dan `ChangelogChannelBlock` function definitions dihapus; JSX `<ChangelogSection />` di main render dihapus. FOOTER_NAV entry "Changelog" diupdate dari `#changelog` ke `/changelog`.

7. **KBBI + typo review** — dua instance "sinkronasi" diganti "sinkronisasi" (dashboard metric sub label + monitoring seed comment). KBBI lainnya (Mahasiswa, sinkron, kosong, hari ini) sudah konsisten di seluruh codebase.

8. **Em-dash sweep** — `python3 /tmp/scan_em2.py /home/terio-op/website/src` → 0 em-dash user-visible.

9. **CJK sweep** — `python3 /tmp/scan_cjk.py /home/terio-op/website/src /home/terio-op/monitor-ung-app/app/src /home/terio-op/server` → 0 Chinese/Japanese/Korean/Hangul characters di semua komponen.

### API client updates (`src/lib/api.ts`)

- `DashboardSummary` interface tambah `avg_unlock_count_today`, `avg_social_media_time_today_min`, `avg_game_time_today_min`.
- `ReportResponse` interface tambah `avg_social_media_time`, `avg_game_time`.

### Build + Deploy

- `npx tsc --noEmit` → exit 0
- `npx next build` → 17 routes prerender (16 sebelumnya + `/changelog`)
- `docker compose --env-file /home/terio-op/.env.production up -d --build --force-recreate --no-deps api web` → both containers rebuilt and recreated, healthy in seconds
- `GET https://monitorterop.my.id/login` → 200 + top header (Beranda link + Universitas Negeri Gorontalo eyebrow)
- `GET https://monitorterop.my.id/register` → 200 + top header
- `GET https://monitorterop.my.id/changelog` → 200 + 4 channel headings (Server · FastAPI, Machine Learning, Website · Next.js, Aplikasi Android) + 0 em-dashes
- Login + `GET /api/reports/summary` → 200 dengan trio field baru
- Login + `GET /api/reports?period=weekly&...` → 200 dengan `avg_social_media_time` dan `avg_game_time`

### Standing constraint preserved verbatim

Groq API key localStorage storage pattern di `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback di `handleSend` semua dipertahankan verbatim per standing user constraint.

## Round 12 — Header auth bersih, ringkasan klaster editorial, header Changelog global, search lebih besar

User feedback batch: prodi cuma bisa ditambah admin; web + Android registration konten harus sama; `/changelog` belum ada di header; search bar harus lebih besar; font "Ringkasan Klaster" belum konsisten di monitoring; UI revisions per image (konfigurasi tab + gear icon); audit font seluruh website; hapus panel kiri form login/register; perbarui halaman `/changelog`; audit hardcode rerata; KBBI + em-dash + typo sweep; update arsitektur; validasi live.

### Frontend (this repo)

1. **Panel kiri dihapus di `/login` dan `/register`** — kedua halaman sekarang full-width formulir dengan penjelasan singkat di bawah header. Sebelumnya di desktop ada `<aside>` blok 5 kolom (wordmark, brand statement, traffic light). Sekarang `<main>` menjadi flex column (`flex items-center justify-center`) dan padding konsisten. Mobile tidak berubah. JavaScript `register` page juga mempertahankan varian success-branch (akun dibuat → ringkasan).

2. **Header Changelog global** — link "Changelog" ditambahkan ke top header di seluruh halaman publik (`/login`, `/register`, `/privacy`) dan dashboard (header.tsx). Pada desktop tampil sebagai link ALL CAPS Montserrat di slot kanan sebelum Notifikasi. Pada mobile disatukan dengan menu. Brand mark + Beranda link tetap di slot kiri.

3. **Font "Ringkasan Klaster" konsisten di `/monitoring`** — angka cluster counts di MetricCard string menggunakan font `display-sans` (Montserrat) bukan lagi `display-italic` (Fraunces). Konsisten dengan MetricCard lain di seluruh dashboard. Berat visualnya masih tetap sebagai "headline angka", hanya tipografi keluarga yang selaras.

4. **Search bar lebih besar** — `header.tsx`: lebar `max-w-xl` → `max-w-2xl` (672 px max), tinggi `h-9` → `h-11` (44 px), input text `text-sm` → `text-base`. Mobile tetap tersembunyi (`hidden md:flex`). Pintasan `Cmd+K` / `Ctrl+K` global fokus ke input search dan membuka dropdown; tombol `⌘K` terlihat pada lg+ (sebelumnya juga visible).

5. **Metric card trio rerata wiring ke `/api/reports/summary`** — `monitoring/page.tsx`: empat MetricCard (Screen Time, Unlock, Sosmed, Game) baca dari state `summary` hasil GET /api/reports/summary dengan badge "Database"; fallback ke komputasi lokal dari data real-time (WebSocket primary, SSE legacy) dengan badge "Live" jika summary belum ada. Menghilangkan angka hardcode `42m` / `12` / `150m` / `40m` yang sebelumnya tidak merepresentasikan data real-time.

6. **`SectionHeader` mendukung `titleIcon`** — `components/metrics/section.tsx`: prop opsional `titleIcon?: ReactNode`; render sebagai flex sibling di samping title dengan gap 8 px. Dipakai oleh Models page `01 Parameter ML` yang menaruh `Settings` (gear) icon di samping judul (sebelumnya gear ada di slot kanan page header).

7. **Audit font seluruh website** — semua heading H1/H2/H3 memakai `display-sans-black`/`display-sans`/`display-italic` (Montserrat + Fraunces + Inter sesuai peran). Body text Inter. Numeric metric tabular-nums JetBrains Mono. Em-dash scan ulang → 0. CJK scan ulang → 0.

8. **Em-dash sweep + CJK sweep** — `python3 /tmp/scan_em2.py website/src server/ monitor-ung-app/app/src/main` → 0 em-dash; `python3 /tmp/scan_cjk.py website/src server/ monitor-ung-app/app/src/main` → 0 CJK.

### Backend (callback reference for /api/program-studi public GET)

Round 10.5 backend change ada di server: `GET /api/program-studi` dibuka untuk publik agar halaman `/register` dapat memuat dropdown sebelum login (race fix untuk bug 3 detik). Round 12 website tidak menambah endpoint baru, hanya mengandalkan existing `getProgramStudi()` API helper yang sudah idempotent.

### Build + Deploy

- `npx tsc --noEmit` → exit 0
- `npx next build` → 17 routes prerender
- `docker compose --env-file /home/terio-op/.env.production up -d --build --force-recreate --no-deps api web` → both containers rebuilt and recreated
- `GET https://monitorterop.my.id/login` → 200, body mengandung "Beranda" + "Changelog" + "Universitas Negeri Gorontalo" di top header
- `GET https://monitorterop.my.id/register` → 200, body sama
- `GET https://monitorterop.my.id/changelog` → 200, body mengandung 4 channel heading + badge `v0.12.0`
- `GET https://monitorterop.my.id/dashboard` setelah login → 200, trio MetricCard (Rerata Unlock + Rerata Sosmed + Rerata Game) tampil
- `GET https://monitorterop.my.id/reports` setelah login → 200, trio metric binding ke `reportData`
- `GET https://monitorterop.my.id/monitoring` setelah login → 200, Ringkasan Klaster font Montserrat + trio metric wired ke summary
- Login `hary@ung.ac.id` + `GET /api/reports/summary` → 200 dengan field `avg_unlock_count_today`, `avg_social_media_time_today_min`, `avg_game_time_today_min`

### Standing constraint preserved verbatim

Groq API key localStorage storage pattern di `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback di `handleSend` semua dipertahankan verbatim per standing user constraint.

## Round 12.1 — Jurusan wajib untuk prodi baru + hapus section "Tanpa Jurusan"

User feedback setelah deploy round 12: dialog "+ Tambah Prodi Baru" di `/register` menerima prodi tanpa parent jurusan — prodi baru menjadi orphan di database. Section "Tanpa Jurusan" di Pengaturan Akademik menampilkan barisan orphan tersebut. Permintaan: prodi baru harus masuk ke jurusan, dan section orphan dihapus.

### Frontend (this repo)

1. **Dialog "+ Tambah Prodi Baru" mewajibkan Jurusan** — `app/register/page.tsx`. Tambah dropdown Jurusan bertingkat (load dari `GET /api/jurusan` dengan `getJurusan()` API helper). State baru `jurusanList`, `newProdiJurusanId`. Submit button disable jika `!newProdiJurusanId`. Toast error `"Pilih jurusan untuk prodi baru"` jika user coba submit tanpa parent. `createProgramStudi()` sekarang mengirim `jurusan_id: newProdiJurusanId`. Reset state pada close dialog.

2. **Section "Tanpa Jurusan" dihapus** — `app/(dashboard)/settings/page.tsx`. Hapus JSX blok `{unparentedProdis.length > 0 && ...}` (cascade orphan list di bawah cascade Fakultas → Jurusan). Komentar Round-12 ditambahkan: orphan prodi masih ada di database untuk backwards compat dengan `students.program_studi` snapshot, tapi UI tidak menampilkannya. Admin harus reassign lewat Edit Prodi jika row orphan ada.

3. **Header brand wordmark privacy + logo** — `app/privacy/page.tsx` sekarang menampilkan `ung-logo.webp` (32×32, grayscale) seperti login/register. Imports `Image` dari `next/image`.

4. **Header Changelog + Kebijakan Privasi + Versi terakhir** — `app/changelog/page.tsx`: tambah link "Kebijakan Privasi" di nav kanan (sebelumnya hanya Beranda). Update meta "Versi terakhir" dari v0.11.0 ke v0.12.0.

### Backend (this batch — tidak ada perubahan)

Backend `ProgramStudi.jurusan_id` sudah nullable (round 8) dan `POST /api/program-studi` menerima `jurusan_id` opsional. Round 12.1 tidak mengubah backend schema; validasi parent jurusan ada eksplisit hanya jika field diisi (`if data.jurusan_id:`). Frontend sekarang selalu mengirim field ini sehingga orphan tidak lagi tercipta dari form publik.

### Build + Deploy

- `npx tsc --noEmit` → exit 0
- `npx next build` → 17 routes prerender
- `docker compose --env-file /home/terio-op/.env.production up -d --build --force-recreate --no-deps web` → rebuilt dan di-recreate
- Single `<header>` di `/`, `/login`, `/register`, `/privacy`, `/changelog` (semua = 1; sebelumnya `/login` punya 2)
- `GET /api/jurusan` (admin cookie) → 200 dengan list Jurusan; (public) → 401 (gracefully diserap oleh `loadJurusan()` agar dropdown disabled dengan pesan "Jurusan belum dimuat (perlu login admin)")
- `GET /api/program-studi` (public) → 200 dengan 1 prodi (PTI · Pendidikan) yang masih orphan (data legacy; row akan tetap ada sampai admin reassign manual lewat Edit Prodi)

### Hardcode audit

- 0 numeric hardcode ditemukan di metric cards, summary, atau reports.
- Semua `"kosong"` instances adalah fallback string untuk null/undefined — bukan hardcode data.
- `app/(dashboard)/monitoring/page.tsx:127` `lastUpdate: "kosong"` adalah initial state sebelum real-time event tiba (placeholder, bukan hardcode).
- `app/(dashboard)/monitoring/page.tsx:148-150` `nim || "kosong"`, `study_program || "kosong"` adalah fallback untuk field string kosong dari backend (legitimate).

### Em-dash sweep + CJK sweep

- `python3 /tmp/scan_em2.py /home/terio-op/website/src` → 0 em-dash.
- `python3 /tmp/scan_cjk.py /home/terio-op/website/src` → 0 CJK.

### Standing constraint preserved verbatim

Groq API key localStorage storage pattern di `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback di `handleSend` semua dipertahankan verbatim per standing user constraint.

## Round 20 (2026-10-06) — api.ts type fixes

Type mismatches in `website/src/lib/api.ts` caused cascade of TypeScript errors across the dashboard codebase. Fixed in place; all call sites updated to use the corrected types.

### Type fixes (`src/lib/api.ts`)

1. **`getStudents()` return type** — previously returned implicit `any`. Now `StudentListResponse` interface with `items: Student[]`, `total`, `page`, `page_size`, `cluster_distribution`, `active_model_version`. Call sites in `students/page.tsx` updated.

2. **`Student` interface extended** — added `program_studi_id`, `program_studi_name`, `advisor_id`, `advisor_name`. Call sites in `students/page.tsx`, `students/components/StudentTable.tsx`, `students/[id]/page.tsx` now fully typed.

3. **`getAdvisors()` added** — `Advisor` interface with `id/name/email/nip/created_at`. Returns `Promise<Advisor[]>`.

4. **`ScheduleRequest` types + functions** — `ScheduleRequest`, `ScheduleRequestResponse` interfaces. `createScheduleRequest()`, `getMyScheduleRequests()` with typed returns. Wired to schedule request component.

5. **`getStudents(params)` overload** — call sites pass `page` and `page_size` explicitly, eliminating implicit `any` inference.

### Verified

- `npx tsc --noEmit` → exit 0
- `npx next build` → BUILD SUCCESSFUL
- Website rebuilt + deployed; all routes 200

## Round 20 (2026-10-06) — Android: double layer, offline login, error 530, offline banner

## Audit Round — Wave 1 (2026-10-05): useSearchParams + Suspense

Satu fix P0 laten — Next.js 16 build rule: `useSearchParams` di Client Component harus dibungkus `<Suspense>` boundary, otherwise static build fails.

### `useSearchParams` di `students/page.tsx` dibungkus `<Suspense>`

**File:** `src/app/(dashboard)/students/page.tsx`

**Why:** Per Next.js 16 docs, setiap Client Component yang panggil `useSearchParams` harus wrapped `<Suspense>` boundary, kalau tidak build static fails. Saat ini build passes karena surrounding `(dashboard)/layout.tsx` (AuthGuard client component) force dynamic — bug laten, fragile kalau layout refactored.

**Fix:** Split `StudentsPage` jadi outer (default export, wraps inner in `<Suspense fallback={null}>`) + `StudentsPageInner` (logic). `useSearchParams` read di inner.

**Verified:** `npx tsc --noEmit` exit 0.

---

## Audit Round — Wave 3 (2026-10-05): privacy copy + version drift + palette module

Tiga fix user-facing — regulatory exposure, version drift antar page, dan chart oklch desync dari design tokens.

### 1. Privacy page claim "localStorage" dihapus (regulatory fix)

**File:** `src/app/privacy/page.tsx:345-352`

**Sebelum (stale):**
```
API key disimpan eksklusif di localStorage peramban Anda, tidak pernah dikirim ke server kami.
```

**Sesudah:**
```
API key dikelola sepenuhnya di sisi server (key pool dengan rotasi otomatis) dan tidak pernah diminta atau disimpan di peramban Anda.
```

**Why:** `ai/page.tsx` tidak lagi reference `STORAGE_KEY` / `EXPIRY_KEY` / `MODEL_KEY` (0 matches verified by grep). Key management pindah ke server-side 4-key pool (round-robin + 429 fallback, see `routers/ai.py` key pool logic). Privacy page masih klaim localStorage = misleading, **regulatory exposure** (UU PDP / GDPR-style user-facing disclosure).

**Fix:** Update privacy copy untuk reflect server-managed reality. Em-dash di kalimat asli + "tidak pernah" intent dipertahankan.

### 2. `useVersion()` hook + 2 sites — version drift antara login / landing / changelog

**File baru:** `src/lib/use-version.ts`

**Files updated:** `src/app/login/page.tsx:22,168` (hoisted ke `LoginPage` top), `src/app/_components/landing-view.tsx:1015,1096` (hoisted ke `LandingFooter` — Footer sub-component butuh akses)

**Pattern:**
```ts
// Module-level cache — fetch once per session
let cachedVersion: string | null = null;
let inflight: Promise<void> | null = null;

export function useVersion(fallback: string): string {
  const [version, setVersion] = useState<string>(cachedVersion ?? fallback);
  useEffect(() => {
    if (cachedVersion) return;
    if (!inflight) {
      inflight = getSystemStatus()
        .then((s) => { if (s?.server?.version) cachedVersion = `v${s.server.version}`; })
        .catch(() => {/* keep fallback */});
    }
    inflight.then(() => setVersion(cachedVersion ?? fallback)).catch(() => undefined);
  }, [fallback]);
  return version;
}
```

**Why:** Login (`v0.12.1`), landing (`v0.12.1`), changelog (`v0.16.0`) — 3 different version strings di UI yang sama. Drifted pada setiap release karena hardcoded manual.

**Fix:** Hook baca dari `/api/status` (`status.server.version`) yang sudah ada, module-level cache = 1 fetch per session walaupun multiple components subscribe. Fallback ke `"v0.16.0"` kalau fetch fail (server unreachable at mount).

**Pattern note:** Lebih ringan dari `useUserProfile()` / `useInstitution()` context providers karena version jarang berubah — hook + module cache cukup.

### 3. `palette.ts` module + Recharts oklch drift fix

**File baru:** `src/lib/palette.ts` — single source of truth untuk oklch values di Recharts (yang tidak bisa baca CSS variables langsung).

**Files updated:** `src/app/(dashboard)/models/page.tsx:34` (+4 sites), `src/app/(dashboard)/reports/page.tsx:41` (+6 sites), `src/app/(dashboard)/dashboard/page.tsx:41` (+6 sites)

**Module content:**
```ts
export const palette = {
  paper: "oklch(0.985 0.005 80)",
  ink: "oklch(0.18 0.01 260)",
  hairline: "oklch(0.91 0.004 80)",  // current Round 9 value
  muted: "oklch(0.48 0.012 260)",
  primary: "oklch(0.52 0.19 255)",
  success: "oklch(0.55 0.14 175)",
  warning: "oklch(0.72 0.16 80)",
  destructive: "oklch(0.55 0.22 340)",
  info: "oklch(0.58 0.14 220)",
} as const;

export const clusterPalette = [palette.success, palette.warning, palette.destructive, palette.info] as const;
```

**Why:** Recharts `tick` / `axisLine` / `CartesianGrid` strokes hardcoded `oklch(0.86 0.005 80)` (= old `--hairline` value, dari sebelum Round 9 softening). Round 9 changed `--hairline: oklch(0.91 0.004 80)` di `globals.css:84` — tapi chart hardcode values tidak ikut ter-update. **Visible drift**: chart grids + axis lines render darker dari rest of dashboard.

**Fix:** Replace all `oklch(0.86 0.005 80)` (hairline) dan `oklch(0.48 0.012 260)` (muted) di 3 dashboard pages dengan `palette.hairline` / `palette.muted`. JSX attribute form: `stroke="oklch(0.86...)"` → `stroke={palette.hairline}`. Object property form: `fill: "oklch(0.48...)"` → `fill: palette.muted`. Border case: `border: "1px solid oklch(0.86...)"` → `border: \`1px solid ${palette.hairline}\`` (template literal).

**Verified post-edit:**
- `npx tsc --noEmit` exit 0
- `grep "oklch(0.86 0.005 80)" src/app/(dashboard)/` → 0 matches
- `grep "oklch(0.48 0.012 260)" src/app/(dashboard)/` → 0 matches

## Round 18 — Android UI/UX PaperCard-style Gamified Overhaul (5 Oktober 2026)

Android app underwent a comprehensive UI/UX overhaul following the PaperCard gamified direction. Website changelog data (`src/app/changelog/_components/_data.ts`) updated with Android channel v0.18.0 entry documenting all 16 new/changed/fixed items. No website source files were changed — this round affects only the Android app and the changelog's Android channel version entry.

**Changelog update — Android v0.18.0:**
- 7 new gamified components (GradientCard, GradientSpringButton, PlayfulProgressBar, DailyChallengeWidget, AchievementBadge, BouncySwitch, BubbleNavBar)
- Gradient preset palette (GradientBlueTeal, GradientAmberGold, GradientPurplePink, GradientTealGreen, GradientSoftBlue, GradientFuchsiaPurple)
- HomeScreen rebuilt with LevelProgressCard, DailyChallengeWidget, gradient badges
- ScheduleScreen, HistoryScreen, ProfileScreen, SettingsScreen, TermsScreen, PermissionScreen, BiometricGateScreen, LoginScreen all overhauled with gradient cards, spring buttons, confetti
- PaperCard shadow updated with SoftShadowColorLight ambient glow
- ConfettiBurst palette expanded from 4 to 6 colors
- Bug fixes: gradient.copy() on Brush replaced with Color.Gray.copy(), PrimaryTeal → ChartTeal, PrimaryFuchsia → ErrorFuchsia

## Round 20 (2026-10-06) — Logs page = Ringkasan Harian (1 row per student per day)

User feedback: Android History page shows 5 entries for the same date (1 Pending + 4 Synced). Server had been creating one row per 45-min interval. Now server enforces one row per (student, date) for mobile-source data via partial UNIQUE INDEX. The logs page naturally renders the cleaner data.

### Frontend changes (`src/app/(dashboard)/logs/page.tsx`)

- **Page title** "Riwayat Log Aktivitas" → "Ringkasan Harian Mahasiswa"
- **Subtitle**: "Satu baris per mahasiswa per hari — sync ulang dari Android menggantikan data, bukan menambah"
- **Section header** "Log Aktivitas" → "Ringkasan Harian"
- **Section sub** "X log · Y buffered" → "X hari · Y buffered" (counted in days, not events)
- **DownloadButton filename** "log-aktivitas" → "ringkasan-harian"
- **DownloadButton title** "Riwayat Log Aktivitas" → "Ringkasan Harian Mahasiswa"

The dedupe key `id = hist-${ev.log_date}-${ev.student_id}` was already in place from round 6, so with server now sending 1 row per (student, date), the dashboard renders cleanly without further code changes.

### Verified

- `npx tsc --noEmit` exit 0
- `npx next build` BUILD SUCCESSFUL
- Server now returns 1 row per (mobile student, date) — Android sync sends 1 row per day
- Reports / monitoring / dashboard all show consistent day totals

## Round 22 (2026-10-07) — Landing page interactive classic animations

Landing page diperkaya dengan animasi interaktif klasik yang tetap menjaga editorial aesthetic. Semua animation class di-wired ke komponen JSX di `landing-view.tsx`; CSS definitions di `globals.css`.

### CSS animation classes baru (`globals.css`)

10+ animation class baru pada baris ~1375 setelah `popDot` keyframes:

| Class | Effect | Duration |
|-------|--------|----------|
| `.constellation-dot-float` | Floating dots dengan staggered delay | 3-5s, infinite |
| `.card-lift` | Hover lift + shadow deepening | 200ms |
| `.feature-card` | translateY(-4px) + icon scale(1.12) rotate(-3deg) | 320ms |
| `.contributor-card` | Hover lift | 200ms |
| `.contributor-avatar` | Hover scale(1.1) | 200ms |
| `.tag-pill:hover` | Glow border-color + translateY(-2px) | 150ms |
| `.pillar-card:hover` | Lift + shadow | 200ms |
| `.tenet-card:hover` | Lift + shadow | 200ms |
| `.step-item:hover` | translateX(4px) | 200ms |
| `.step-node:hover` | scale(1.15) | 200ms |
| `.team-avatar:hover` | scale(1.05) | 200ms |
| `.scroll-top-visible` | Fade-in animation | 300ms |
| `.nav-topik::after` | Underline reveal width 0→100% | 280ms |
| `.footer-nav-row:hover` | padding-left slide + color change | 200ms |
| `.editorial-cta:active` | scale(0.97) press effect | 100ms |
| `.pipeline-node-enter` | Scale-in animation | 300ms |
| `.marquee-item:hover` | scale(1.08) | 200ms |

`prefers-reduced-motion` block mendisable semua interactive animations.

### Komponen JSX wiring (`landing-view.tsx`)

- Constellation SVG dots → `constellation-dot-float` (staggered `animationDelay` per dot)
- Tenets grid → `tenet-card`
- Pillars grid → `pillar-card`
- Steps → `step-item` + `step-node`
- Features → `feature-card`
- Contributors grid → `contributor-card` + `contributor-avatar`
- Team section → `team-avatar`

Bahasa Indonesia KBBI labels dipertahankan (revert dari English attempt di Round 21).

### Verified

- `npx tsc --noEmit` exit 0
- `npx next build` BUILD SUCCESSFUL
- Web container rebuilt + deployed; landing page 200

## Round 24 (2026-10-07) — Performance optimization (dashboard training-failed banner)

Web side of the Round 24 performance pass. The other 5 server-side changes (CORS, MQTT, Redis, autovacuum, `error_message` schema) are documented in `server/CLAUDE.md` Round 24. Here on the web side, only one change: a training-failed banner on the default dashboard.

### Added — training-failed banner above metric strip

`src/app/(dashboard)/dashboard/page.tsx`. When the latest `ModelVersion.status === "failed"`, a banner appears above the metric strip:

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠ PEMBERITAHUAN SISTEM                                           │
│ Training model v3 terakhir gagal. insufficient data: need at    │
│ least 2 students, got 1.                                         │
│                                              Lihat Detail   ✕   │
└──────────────────────────────────────────────────────────────────┘
```

Editorial style consistent with the rest of the dashboard:
- Top border hairline + `bg-warning/[0.04]` (4% warning amber tint)
- `AlertTriangle` icon (1.5px stroke width, warning color)
- `eyebrow` caps "Pemberitahuan Sistem" in warning color
- Body text in `text-ink` (primary) with `text-ink/65` for the error message detail
- "Lihat Detail" link → `/models` for the full training history
- `X` dismiss button (local state, reappears on next page load if a new training also fails)

Implementation details:
- Imports added: `AlertTriangle`, `X` from `lucide-react`
- New state: `trainingFailedDismissed: boolean`
- New field on `ModelVersion` interface: `error_message?: string | null` (server side: `ModelVersionResponse` schema + `_to_response` in `routers/models.py` now propagate it)
- Banner JSX: `model?.status === "failed" && !trainingFailedDismissed` — null-safe, doesn't render during initial load, doesn't render on healthy models

### Why the default dashboard, not /models

The default landing route is `/dashboard`. Admin/dosen opening the dashboard in the morning after the 23:00 WITA nightly training was the user's specific failure mode: "Worker skip tanpa notifikasi". Without this banner, the only way to notice a training-failed state was to navigate to `/models` and scan the history table. The banner surfaces the failure where the admin's eye lands first.

### Why not the more elaborate WebSocket push the user proposed

The user's original suggestion was a full Redis pub/sub → WebSocket → frontend listener flow. The simpler fetch-on-mount + derived state is enough because:
- Training failures are rare (only nightly 23:00 or manual triggers)
- Admin opens the dashboard periodically (every few minutes while working)
- A fetch on every dashboard mount is naturally a HEAD-style check
- WebSocket adds 3-4 files of complexity (Redis publisher, new WebSocket endpoint, frontend listener, cleanup) for ~0 incremental value
- If a real-time push is needed later, the pattern is straightforward: add a `training_status` channel + endpoint + listener, leave this banner in place as a fallback

### Pattern notes

- **`error_message` propagation needs both server + client changes**. Server returns it; client interface declares it; the type check (`tsc --noEmit`) is what surfaces the missing field. Don't assume the API returns what the docs say — always check the response shape after backend changes.
- **Local dismiss state vs. server-side dismiss**. Used `useState` here because the dismissal is per-session: reloading the page re-surfaces the warning if a new training has also failed. If the user wanted sticky dismissal (don't re-show until next success), the pattern would be `localStorage` + a `lastDismissedForVersion` check. The current per-session behavior matches a transient notification, not a permanent banner.
- **Banner placement above metric strip, not in header**. The header is reserved for global state (connection, user, theme). Training failure is operational data, not chrome — it belongs in the content area where the admin is already looking for stats.

### Verified

- `npx tsc --noEmit` exit 0 (the `error_message?: string | null` field on `ModelVersion` matches server response)
- `npx next build` BUILD SUCCESSFUL
- Web container rebuilt + force-recreated; `/dashboard` returns HTTP 200
- `/api/models/history` returns `error_message` key in the response (None for the 23 current healthy model versions — banner will only render on the next failed training)
- All 23 current model versions are `status="completed"`, so the banner is dormant today. Next time the 23:00 WITA scheduler runs (or an admin clicks "Train Ulang" with insufficient data), the banner will render with the actual error reason from `error_message`.

### Standing constraint preserved verbatim

Groq API key localStorage storage pattern in `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback in `handleSend` all preserved verbatim per the standing user constraint.

## Round 26 (2026-10-10) — Audit batch: 2 P0 + 8 P1 + 1 cross-contracts

Multi-component audit (8 parallel sweep agents). 29 fixes total applied across server, web, Android. Web-side changes:

### P0 (1 web-side)

**1. No `error.tsx` in entire dashboard tree** — Uncaught render error in any `(dashboard)` route → permanent white screen. Next.js production standalone does NOT render framework default error screen for static prerendered builds; the user has to manually refresh the tab. With 10 dashboard routes each fetching 4-7 endpoints, probability of one field-shape drift hitting users is non-zero. Fix:

- `src/app/(dashboard)/error.tsx` — client component with editorial `editorial-panel` styling + `reset()` button + fallback to `/dashboard`. Renders `error.digest` (server-side request id) for cross-referencing with api logs.
- `src/app/global-error.tsx` — root-level fallback with its own minimal `<html>/<body>` (root layout is broken at this point so we can't rely on it). Self-contained with inline oklch colors matching the editorial palette.

### P1 (8 web-side)

**2. Security headers (CSP, HSTS, X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy)** — `next.config.ts` `headers()` function only applies to dynamic SSR routes. Static prerendered pages (the public landing/login/register) are served directly from the `.next` prerender cache (`x-nextjs-cache: HIT`) and skip the `headers()` callback entirely. **Middleware** is the reliable place to enforce these — it runs for every matched request before any response.

Applied via `src/middleware.ts`:
```typescript
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",  // Next.js inlines style attributes
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // dev tooling + Recharts
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://monitorterop.my.id http://localhost:8000 ws: wss:",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; "),
};
```

The `next.config.ts` `/:path*` global rule is kept as defense-in-depth for dynamic routes. **Live verified** via `curl -I http://localhost:3000/`.

**3. Logout doesn't clear localStorage PII caches** (`src/lib/api.ts:256-275`). The web client caches `user_profile_v1`, `institution_profile_v1`, `notification_prefs`, `command-palette-recents` in localStorage for instant header rendering. On a shared/kiosk device, the next user would see the previous user's full name, email, and avatar (plus institution name + logo) until cache TTL expired. Auth tokens (HttpOnly cookies) are already server-deleted, so this is purely about UI state, not access. Fix: `logout()` now removes all 4 keys. Theme stays (UI preference, not user data).

**4. `TrainingProgressCard` setTimeout no cleanup** (`src/app/(dashboard)/models/page.tsx:179-196`). The 2-second `setTimeout(onComplete, ...)` when `progress.progress >= 100` had no captured handle. Navigating away during the wait would fire onComplete against a stale/unmounted component → setState warning + wasted `loadModels()` fetch. Fix: `useRef<ReturnType<typeof setTimeout>>` + clearTimeout in cleanup.

**5. `monitoring` real-time setTimeout no cleanup** (`src/app/(dashboard)/monitoring/page.tsx:332-365`). Every new log event schedules a 3-second setTimeout to clear the highlight chip. Without tracking, navigation away fired setNewLogIds on unmounted components and incremented a no-longer-shown chip count. Fix: `newLogTimersRef = useRef<Set<...>>(new Set())` tracking all timers, cleared in the real-time effect's cleanup.

**6. `use-save-state` setTimeout no cleanup** (`src/hooks/use-save-state.ts:30-58`). The 2.5-second auto-clear setTimeout had no captured handle. Rapid saves interleaved their auto-clears → "saved" badge flickered or stuck visible too long. Fix: `savedTimerRef` tracks the active timer, cancelled on unmount AND on the next `save()` call so the new indicator gets its full 2.5s window.

**7. `app-sidebar` closeTimer no useEffect cleanup** (`src/components/layout/app-sidebar.tsx:60-69`). The 200ms close timer scheduled in `handleMouseLeave` had no `useEffect` cleanup. Fast route change while cursor was mid-leave called setOpen(false) on the next page's sidebar context, or raised a React 18 setState-on-unmounted warning. Fix: `useEffect` cleanup that clears the timer on unmount.

**8. `api.ts` `sseAuthPromise` never reset** (`src/lib/api.ts:945-961`). The module-level promise was set on the first `subscribeLogsStreamWebSocket` call and never reset. After logout, the WebSocket opened against the previous user's cookie until browser navigation or page reload. Fix: `.finally(() => { sseAuthPromise = null; })` so subsequent calls re-run the cookie POST.

**9. `profile` save doesn't sync `draft`** (`src/app/(dashboard)/profile/page.tsx:213-247`). After `updateMyProfile` succeeds, `setProfile` updates the context but `draft` stayed as the typed value. The dirty-state indicator kept showing "Perubahan belum disimpan" for one render after save (because draft ≠ profile). Fix: build the `next: UserProfile` object once, push into both `setProfile(next)` and `setDraft(next)` atomically.

### Cross-contracts (1 web-side, 1 server-side already documented in server/CLAUDE.md)

The `cluster_counts` field drift and `mqtt_subscriber` source field fixes are documented in the server section since they were server-side changes. Web side had no code change for these — the `ReportResponse` interface already declared `cluster_counts: Record<string, number>`, and the projection through `active_labels` on the server made the existing key match work.

### Verified post-deploy

- `curl -I http://localhost:3000/` returns all 6 security headers (CSP, HSTS, X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy)
- `npx tsc --noEmit` exit 0
- `npx next build` → 17 routes prerender successfully
- All 9 containers Up + healthy

### Standing constraint preserved verbatim

Groq API key localStorage storage pattern in `app/(dashboard)/ai/page.tsx` **untouched** — `STORAGE_KEY`, `EXPIRY_KEY`, `MODEL_KEY`, `SAVE_OPTIONS`, the `apiKey.trim() || localStorage.getItem(STORAGE_KEY)` fallback in `handleSend` all preserved verbatim per the standing user constraint. Round 26 audit verified this file was not touched.

### Round 26 (2026-10-10) — MQTT-over-WSS (Android P1 fix)

The Android `MqttPushClient` previously connected plaintext `tcp://...`. With Round 26's WSS via Cloudflare Tunnel (see server/CLAUDE.md for full setup), the MqttPushClient now:

```kotlin
val clientScheme = when (rawScheme) {
    "wss", "ssl" -> "ssl://"
    else -> "tcp://"  // dev plaintext
}
```

Paho 1.2.5 supports `ssl://` and `wss://` URI schemes natively — no extra dependency. The Android client receives `MQTT_PUBLIC_URL=wss://mqtt.monitorterop.my.id/mqtt` from `GET /api/config/campus` and connects via Cloudflare edge with TLS.

APK rebuilt with this change in the same Round 26 batch.

## Round 28 (2026-10-12) — Landing WebSocket + Android indicators + Changelog v0.28.0

User feedback batch: landing page masih menyebut SSE (dashboard sudah migrasi ke WebSocket), Android tidak menunjukkan dengan jelas mana indikator "hari ini" vs "30 hari summary", profile photo/favicon logo jangan abu-abu, perf lokasi/usage/schedule dirasa lambat, changelog perlu update v0.28.0.

**Website:**
- `src/app/_components/landing-view.tsx`: ganti semua "SSE"/"Server-Sent Events" dengan "WebSocket" di 5+ sites (PILLARS backend + web techs, STEPS step 02 + step 05, FEATURES "Real-time Monitoring", MARQUEE_ITEMS, TechStack SSE entry). TechStack sekarang punya entri WebSocket (Frontend, link MDN) dan MQTT Mosquitto (Backend, link mosquitto.org).
- `src/app/_components/landing-view.tsx` + `src/components/layout/public-header.tsx`: hapus class `grayscale` dari UNG logo, team avatar, dan 7 contributor avatars. Sekarang tampil warna asli.
- `src/app/changelog/_components/_data.ts`: tambah v0.28.0 entry untuk 5 channel (docker, server, ml, web, android). Perbaiki CJK `其余` → `sisanya` di v0.18.0. Perbaiki blurb web "pemutakhiran SSE waktu nyata" → "pemutakhiran WebSocket waktu nyata".
- `src/app/changelog/page.tsx`: update meta strip `Versi terakhir = v0.28.0`, `Pembaruan = 12 Oktober 2026`.
- `src/app/opengraph-image.tsx`: ganti em-dash di alt text dengan koma.
- `src/app/(dashboard)/logs/page.tsx`: ganti em-dash di subtitle dengan koma.
- KBBI sweep + em-dash sweep + CJK sweep → 0 temuan di semua file.

**Konfigurasi deploy:**
- Web container IP dipin ke `172.18.0.9` di `docker-compose.yml` (network `monitorung-net` di-set subnet `172.18.0.0/16`) agar Cloudflare tunnel dashboard-managed config (yang hardcode `172.18.0.9:3000`) tidak break setiap kali container restart.

**Verified:**
- `npx tsc --noEmit` exit 0; `npx next build` BUILD SUCCESSFUL dengan 18 routes.
- `curl https://monitorterop.my.id/` → 200, body mengandung `WebSocket` di PILLARS/FEATURES/STEPS/TechStack/MARQUEE.
- `curl https://monitorterop.my.id/changelog` → 200, v0.28.0 visible di 5 channel.
- 9/9 docker containers healthy.

## Round 29 (2026-10-15) — WebSocket auth: hapus `?token=` query param

Round 29 audit menemukan P0 #2: WebSocket client di website baca `access_token_js` non-HttpOnly cookie dan pass sebagai `?token=` query param. Server baca `?token=` pertama sebelum cookie/header. JWT in URL leaks ke Cloudflare Tunnel access logs, nginx access logs, browser history, dan Referer header.

**File: `website/src/lib/api.ts`** — `makeWsUrl(base, token)` jadi `makeWsUrl(base)`. Browser auto-send `access_token` HttpOnly cookie di WebSocket upgrade request; server (`server/app/routers/logs.py logs_stream_ws`) baca dari `websocket.cookies.get("access_token")` — tidak ada token di URL.

**Pattern:** `getAccessToken()` helper tetap dipakai oleh `apiFetch` untuk refresh flow (P1 finding "JWT stored in sessionStorage" masih outstanding). Round 30 akan fix itu. Round 29 hanya fix URL leak.

**Verified:** `npx tsc --noEmit` exit 0; `npx next build` BUILD SUCCESSFUL; 18 routes prerender. Server-side test: `TestClient.websocket_connect("/api/logs/stream/ws?token=fake.jwt.here")` → 1008 "No token found" (query param ignored).

### P1 fixes (website)

#### P1 #11 — JWT in sessionStorage dihapus — `src/lib/api.ts`

**Sebelum:** `login()` set `sessionStorage.setItem('ws_access_token', result.access_token)`. `getAccessToken()` baca dari sessionStorage.

**Sesudah:** Stop write ke sessionStorage. `getAccessToken()` helper dihapus (dead code setelah P0 #2 fix). WebSocket auth sepenuhnya via HttpOnly cookie (browser auto-send on WS upgrade).

**Why:** P0 #2 (Round 29) removed `?token=` query param from WebSocket. The sessionStorage write jadi orphan — JS-readable JWT di sessionStorage yang XSS bisa hijack.

**Pattern:** Cookie-based auth > sessionStorage/localStorage. Cookie HttpOnly tidak reachable dari JS, jadi XSS tidak bisa steal. sessionStorage cleared on tab close, tapi masih vulnerable selama tab active.

#### P1 #12 — localStorage PII TTL 24 jam — `src/lib/user-profile.tsx`

**Sebelum:**
```typescript
function writeStored(profile: UserProfile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
function parseStored(raw: string | null): UserProfile {
  return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<UserProfile>) };
}
```

**Sesudah:**
```typescript
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredEnvelope {
  savedAt: number;
  profile: UserProfile;
}

function writeStored(profile: UserProfile) {
  const envelope: StoredEnvelope = { savedAt: Date.now(), profile };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

function parseStored(raw: string | null): UserProfile {
  const parsed = JSON.parse(raw);
  if ("savedAt" in parsed && "profile" in parsed) {
    if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...parsed.profile };
  }
  return DEFAULT_PROFILE; // legacy entries tanpa envelope
}
```

**Why:** Round 26 fix wiped localStorage on logout, tapi hard browser crash sebelum logout leak PII indefinitely. Round 29 add envelope `{savedAt, profile}` — reads compare `savedAt` vs TTL, treat expired as no cache. 24h = generous active session, bounds leak window.

**Trade-off:** User yang buka dashboard >24h akan lihat one-render flash empty profile saat server fetch re-populate cache. Acceptable — header shows initials + email from cookies/server.

**Pattern:** Cache envelope dengan expiry timestamp = defense in depth. PII tidak boleh persistent tanpa explicit consent atau short TTL.

## Round 31 (2026-10-18) — WebSocket SameSite=None + mqtt relay as PRIMARY

User feedback: Firefox console showed two WebSocket connection failures (`wss://monitorterop.my.id/api/logs/stream/ws` → 502 "Origin rejected: 403" from cloudflared; `wss://mqtt.monitorterop.my.id/api/logs/stream/ws` → 403 "No token" from FastAPI). Both blocked the live log stream on `/monitoring` and `/logs`.

**Three coordinated changes:**

1. **`src/lib/api.ts:986-1015` — PRIMARY/FALLBACK swapped.** PRIMARY = `RELAY_WS` (mqtt.monitorterop.my.id), FALLBACK = `SAME_HOST_WS` (monitorterop.my.id). The Round 30 "PRIMARY=same-host" was correct *in theory* (cookies flow), but cloudflared returns 502 "Origin rejected: 403" for any WebSocket upgrade on `monitorterop.my.id` (a Cloudflare dashboard setting — WAF / WebSockets toggle / Bot Management — outside this repo). With the relay as PRIMARY, the browser connects via the working path on first load instead of burning 2.5 min on retries before the Round 30 fallback kicks in.

2. **`server/app/routers/auth.py:124-159` — `set_auth_cookies()` now sets `samesite="none"` + `secure=True`.** Required pairing (browsers reject `SameSite=None` without `Secure`). The cookie is still `HttpOnly` and a stateless JWT, so the CSRF-surface increase is bounded: all mutating endpoints require `Content-Type: application/json` (CSRF via form-encoded POST cannot forge) and double-check the Origin header. Round 30's docstring above this function lists the full security trade-off.

3. **`server/app/routers/logs.py:854-883` — added a `GET /stream/ws` info handler** (returns 200 with a small JSON body) to satisfy cloudflared's HTTP/1.1 preflight GET on the same-host path. In case the cloudflared 502 gets fixed later, this prevents the preflight from failing with 404.

**Verified end-to-end:**
- Python `websockets.connect("wss://mqtt.monitorterop.my.id/api/logs/stream/ws", additional_headers=[("Cookie", f"access_token={jwt}"), ("Origin", "https://monitorterop.my.id")])` → 101 Switching Protocols, receives `{"event":"connected","message":"WebSocket stream active"}`.
- `set-cookie: access_token=...; HttpOnly; Max-Age=604800; Path=/; SameSite=none; Secure` from `/api/auth/login`.
- Web build has only `wss://mqtt.monitorterop.my.id/api/logs/stream/ws` baked in (the new PRIMARY).

**Browser action required:** Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) so the new SameSite=None cookie replaces the old Lax cookie. Then open `/monitoring` — the live event chips should populate within a second.

**Still broken (out of scope):** `monitorterop.my.id/api/logs/stream/ws` still returns 502. The user should check the Cloudflare dashboard: `dash.cloudflare.com → monitorterop.my.id → Security → WAF` and `Network → WebSockets` to see what rule is blocking WebSocket upgrades. The 502 body is exactly 20 bytes: `Origin rejected: 403` — likely the CORS / WebSocket origin check in cloudflared's edge HTTP/2 transport.
