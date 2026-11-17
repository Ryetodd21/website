# Monitor UNG — Website

Halaman publik dan dashboard staf untuk **Sistem Monitoring Distraksi Belajar Mahasiswa, Universitas Negeri Gorontalo**.

Website ini membaca data yang dikirim aplikasi Android (screen time, unlock, lokasi kampus) lewat API FastAPI, lalu menampilkannya sebagai metrik, log, laporan, dan hasil klaster PCA + K-Means. Mahasiswa memakai aplikasi Android; dosen dan admin memakai website.

- Production: <https://monitorterop.my.id>
- Backend: `../server/` (FastAPI, port 8000)
- Android: `../monitor-ung-app/`

## Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 16.3.5 (App Router, `output: "standalone"`) |
| UI | React 19.2.8, TypeScript 5, Tailwind CSS 4 |
| Komponen | shadcn `base-nova` di atas `@base-ui/react` (**bukan** seluruhnya Radix) |
| Grafik | Recharts 3 |
| Peta | Leaflet 1.9 |
| Markdown | react-markdown + remark-gfm (halaman AI) |
| Notifikasi | Sonner |
| Ikon | lucide-react |
| Lint | ESLint 9 (`eslint-config-next`) |

Alias path `@/*` → `src/*`. Lockfile npm.

## Menjalankan lokal

Prasyarat: Node.js 22 (Dockerfile memakai `node:22-alpine`) dan backend berjalan di port 8000.

```bash
npm ci
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local
npm run dev
```

Buka <http://localhost:3000>. Build memakai `next/font` (Google Fonts) sehingga butuh koneksi jaringan.

### Variabel environment

Hanya variabel `NEXT_PUBLIC_*` yang dibaca browser. Nilainya di-inline saat build, jadi mengubahnya butuh build ulang.

| Variabel | Wajib | Kegunaan |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | ya (build) | Base URL API, mis. `https://monitorterop.my.id` atau `http://localhost:8000`. Default `http://localhost:8000`. |
| `NEXT_PUBLIC_WS_RELAY_URL` | tidak | URL WebSocket relay. Hanya dipakai bila hostname-nya sama dengan API — cookie auth bersifat host-only sehingga relay lintas host tidak bisa terautentikasi. Kosongkan bila tidak ada. |
| `NEXT_PUBLIC_ALLOW_UNSAFE_EVAL` | tidak | Set `true` hanya bila butuh `unsafe-eval` di CSP (dev/tooling). Production biarkan kosong. |
| `NEXT_PUBLIC_ADMIN_EMAIL` | tidak | Email admin yang ditampilkan di UI. |
| `NEXT_PUBLIC_SITE_URL` | tidak | Override `metadataBase` untuk URL aset OG. Default `https://monitorterop.my.id`. |
| `ANALYZE` | tidak | `true` saat `npm run build` untuk membuka bundle analyzer. |

## Halaman

| Route | Peran |
| --- | --- |
| `/` | Landing publik |
| `/login`, `/register` | Masuk dan pendaftaran publik (akun baru menunggu persetujuan admin) |
| `/privacy`, `/changelog` | Kebijakan privasi dan riwayat perubahan |
| `/dashboard` | Ringkasan metrik dan grafik |
| `/monitoring` | Pemantauan mahasiswa, aktivitas, konteks lokasi |
| `/students` | Daftar mahasiswa dan hasil klaster |
| `/logs` | Riwayat log, filter, stream realtime |
| `/models` | Konfigurasi model, training, versi |
| `/reports` | Rekap dan tren |
| `/ai` | Analisis percakapan (diproses backend via Groq) |
| `/akademik` | Fakultas, jurusan, prodi, mata kuliah, jadwal |
| `/settings` | Institusi, kampus, pengguna |
| `/profile` | Profil sendiri |

Semua route staf berada di grup `(dashboard)` — nama grup tidak muncul di URL. Role `admin` dan `dosen` boleh masuk dashboard; `mahasiswa` tidak.

## Struktur

```
src/
├─ app/
│  ├─ layout.tsx              # font, tema, script anti-flash
│  ├─ page.tsx                # landing
│  ├─ login/ register/ privacy/ changelog/
│  └─ (dashboard)/            # layout staf: AuthGuard + provider + sidebar
├─ components/
│  ├─ ui/                     # primitif shadcn
│  ├─ auth/                   # AuthGuard, RoleGate, AccessDenied
│  ├─ layout/                 # AppLayout, AppSidebar, Header, filter akademik
│  ├─ charts/ metrics/        # Recharts + kartu metrik
│  ├─ maps/                   # pemilih lokasi Leaflet
│  ├─ notifications/          # panel notifikasi
│  └─ theme-toggle.tsx
├─ hooks/                     # use-api-resource, use-mobile, use-dirty-state, ...
├─ lib/
│  ├─ api.ts                  # SEMUA request API + tipe
│  ├─ user-profile.tsx        # profil untuk header/sidebar
│  ├─ institution.tsx         # cache profil institusi
│  └─ academic-filter.tsx     # filter jurusan/prodi global
└─ proxy.ts                   # security header (pengganti middleware.ts)
```

## Aturan yang perlu diketahui sebelum mengubah kode

Penjelasan lengkap ada di [`AGENTS.md`](./AGENTS.md). Yang paling sering menjebak:

1. **Jangan buat client API baru per halaman.** Semua request lewat `apiFetch<T>` di `src/lib/api.ts`.
2. **Token tidak disimpan di browser storage.** Autentikasi web memakai cookie HttpOnly dari backend; `credentials: "include"` sudah diurus `apiFetch`. `localStorage` hanya untuk tema dan cache profil institusi.
3. **`AuthGuard` bukan batas keamanan.** Otorisasi sebenarnya ada di backend. Menyembunyikan menu bukan proteksi.
4. **Filter akademik global jangan dihapus.** `AcademicFilterProvider` memancarkan `CustomEvent("academic-filter-changed")`; dashboard, students, monitoring, reports, dan logs berlangganan. Header `x-jurusan-id` / `x-program-studi-id` disuntik otomatis oleh `apiFetch`.
5. **`src/proxy.ts`, bukan `src/middleware.ts`.** Konvensi `middleware` sudah deprecated di Next.js 16. File proxy selalu berjalan di runtime Node.js dan hanya memasang security header — bukan autentikator.
6. **Status harus punya teks atau ikon, bukan hanya warna.** Pertahankan loading, empty, error, retry, offline/pending, focus ring, label input, dan `prefers-reduced-motion`.
7. **Jangan naikkan cache `/_next/static/chunks`.** Nilainya `max-age=300` dengan sengaja; ada catatan tradeoff di `next.config.ts`.
8. **`next/og` (satori) tidak mendukung warna `oklch()`.** Di `src/app/opengraph-image.tsx` pakai hex/rgba. File itu dirender statis saat build — jangan tambahkan `export const runtime = "edge"` (deprecated di Next 16 dan memicu warning build).
9. **`images: { unoptimized: true }` di `next.config.ts`.** Semua `<Image>` berukuran kecil dan sudah pas (logo 40px, avatar 240/56), jadi optimizer `sharp` tidak dipakai saat runtime — hemat RAM container web. Jangan kembalikan `remotePatterns` tanpa alasan; kalau menambah gambar besar, optimasi manual dulu.
10. **`metadataBase` di `src/app/layout.tsx`.** Tanpa itu URL aset OG di-resolve ke `http://localhost:3000` saat build. Bisa ditimpa `NEXT_PUBLIC_SITE_URL`.

## Pemeriksaan

```bash
npm run lint
npx tsc --noEmit
npm run build
node scripts/regression-check.cjs
node scripts/dashboard-ui-check.cjs
```

- `regression-check.cjs` — refresh/retry, logout & cache, siklus WebSocket, keamanan CSV, batas minggu WITA.
- `dashboard-ui-check.cjs` — animasi metrik, pembatalan request, loading/retry, label klaster dinamis, alur AI.
- `workspace-browser-check.cjs` — Playwright/Chromium, butuh server lokal dan `NODE_PATH` ke instalasi Playwright (lihat `AGENTS.md`).

Tidak ada script `test` di `package.json`. Kedua check di atas memakai hook/API tiruan — bukan pengganti pengujian browser nyata.

## Build dan deploy

Image production memakai `output: "standalone"`:

```bash
docker build -t monitorung-web:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://monitorterop.my.id \
  --build-arg NEXT_PUBLIC_WS_RELAY_URL=wss://mqtt.monitorterop.my.id/api/logs/stream/ws \
  .
```

Di VPS (`/opt/monitorung`):

```bash
docker compose --env-file .env.production -f docker-compose.yml -f compose.vps.yml up -d --no-deps --wait web
```

Nginx host meneruskan `/` ke `127.0.0.1:3000` dan `/api/` + `/mqtt` langsung ke `127.0.0.1:8000` (API tidak lewat Node). Setelah mengubah aset di `public/`, verifikasi ukurannya **di dalam container**, bukan hanya di host.
