<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Memory Website Monitor UNG

Terakhir dicocokkan: 2026-11-17. Berlaku untuk `/home/terio-op/website`. Baca juga [memory proyek](../AGENTS.md), [backend](../server/AGENTS.md), dan [Android](../monitor-ung-app/AGENTS.md) saat kontrak lintas komponen berubah. Blok Next.js di atas wajib dipertahankan.

## Tujuan dan stack

Halaman publik plus dashboard staf untuk membaca distraksi belajar, mengelola akademik dan institusi, memantau log, melatih/membaca model, laporan, dan AI Analisis. Mahasiswa memakai Android untuk pengumpulan aktivitas.

Next.js 16.4.6 App Router, React 19.2.8, TypeScript 5, Tailwind 4, ESLint 9. UI memakai shadcn `base-nova` dengan `@base-ui/react` — **bukan** semua primitive Radix. Juga: lucide-react, Recharts 3, Leaflet 1.9, Sonner, react-markdown/remark-gfm, CVA, tw-animate-css. Gunakan dependency terpasang; jangan tambah library UI untuk pola yang sudah ada.

CI: `.github/workflows/ci.yml` — `npm ci --legacy-peer-deps`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm audit --omit=dev --audit-level=high`, Trivy fs, SBOM CycloneDX. `shadcn` ada di `devDependencies` (hanya dipakai `@import "shadcn/tailwind.css"` di globals.css); jangan pindahkan balik ke dependencies — rantai `ts-morph`/`minimatch`-nya dev-only.

Alias `@/*` → `src/*`. Output `standalone`. Lockfile npm. `README.md` masih template create-next-app, bukan dokumentasi arsitektur.

## Halaman

| Route | Peran |
| --- | --- |
| `/` | Landing publik (`src/app/_components/landing-view.tsx`). |
| `/login`, `/register` | Masuk dan pendaftaran publik; backend memutuskan role/aktivasi. |
| `/privacy`, `/changelog` | Privasi dan riwayat perubahan (`src/app/changelog/_components/_data.ts`). |
| `/dashboard` | Ringkasan metrik dan grafik. |
| `/monitoring` | Pemantauan mahasiswa, aktivitas, konteks lokasi. |
| `/students` | Daftar/pengelolaan mahasiswa dan hasil klaster. |
| `/logs` | Riwayat log, filter, stream. |
| `/models` | Konfigurasi model, training, versi, visualisasi. |
| `/reports` | Rekap dan tren. |
| `/ai` | Percakapan analisis via backend Groq. |
| `/akademik` | Fakultas, jurusan, prodi, mata kuliah, jadwal, request. |
| `/settings` | Institusi, kampus, pengguna. |
| `/profile` | Profil sendiri. |

Route dashboard di grup `(dashboard)`; nama grup bukan bagian URL. Layout bersama: `AuthGuard`, `InstitutionProvider`, `UserProfileProvider`, `AcademicFilterProvider`, `SidebarProvider`, sidebar, header, konten, shortcut help, navigasi mobile. `STAFF_PATH_PREFIXES` di `(dashboard)/layout.tsx` mencakup semua route staf kecuali `/profile`. `STAFF_ROLES` = `admin`, `dosen`. Izin per operasi tetap mengikuti backend.

## API dan auth

1. `src/lib/api.ts` pusat request dan tipe. Pakai fungsi existing atau `apiFetch<T>`; jangan buat client paralel per halaman.
2. Browser mengirim `credentials: "include"`; token tidak di localStorage/sessionStorage. Theme dan cache profil institusi boleh di penyimpanan lokal karena bukan kredensial.
3. `apiFetch` refresh saat 401 (di luar endpoint auth tertentu); `refreshInFlight` menyatukan refresh bersamaan. Hanya refresh 401 mengarah ke login; jaringan/429/5xx/timeout menghasilkan error yang bisa di-retry.
4. `noRedirect` untuk request publik. Tangani `AbortError` dan `RedirectError` tanpa toast palsu.
5. Response 204 → `undefined`. Error Pydantic/HTTP dinormalisasi dari `detail`; jangan anggap selalu string.
6. `getCurrentUser()` memakai `noRedirect`, null saat gagal. Logout hanya navigasi setelah API berhasil; cache profil dibersihkan. Login sukses membersihkan cache akun sebelumnya.

`AuthGuard` menangani sesi UI, `RoleGate` memeriksa role; saat role belum diketahui RoleGate boleh optimistis. Data sensitif tetap dijaga endpoint. `src/proxy.ts` memasang security headers, bukan autentikator dashboard. Konvensi `middleware` sudah deprecated di Next.js 16 — jangan membuat `src/middleware.ts` baru; export-nya `proxy`, `config.matcher` tetap, dan file proxy selalu jalan di runtime Node.js.

`src/lib/user-profile.tsx` profil untuk header/sidebar/page. `src/lib/institution.tsx` cache lokal `institution_profile_v1`, pemetaan snake/camel, logo maks 2 MB.

## Filter akademik

`src/lib/academic-filter.tsx` + `src/components/layout/academic-filter-bar.tsx`. **Jangan hapus.**

- `AcademicFilterProvider` mem-fire `CustomEvent("academic-filter-changed")`. Subscriber: dashboard, students, monitoring, reports, logs.
- Header `x-jurusan-id` / `x-program-studi-id` disuntik `apiFetch` dari module-level state. Path meta (`/api/jurusan`, `/api/fakultas`, `/api/auth`) tidak membawa header.
- Dosen: jurusan dikunci ke afiliasi, hanya prodi yang bisa dipilih. Admin: bebas.
- `eventInAcademicScope()` membuang event stream di luar scope; event tanpa `program_studi_id` tetap tampil.
- **Exact match wajib.** `normalizeAcademicName()` = lowercase + buang non-alfanumerik + trim. Substring matching pernah membuat kode `SI` cocok ke "Pendidikan Teknologi Informasi" dan mengunci dosen SI ke data PTI. Jangan dikembalikan.

Halaman Akademik punya filter prodi lokal per tabel Mata Kuliah dan Jadwal (`filterProdiMk`/`filterProdiJdw`), dengan empty state berbeda untuk "filter kosong" vs "belum ada data".

## Realtime

- `subscribeLogsStreamWebSocket` di `src/lib/api.ts` mengembalikan cleanup. Panggil saat unmount; jangan buat stream ganda atau timer reconnect yang tertinggal.
- Path aktif `/api/logs/stream/ws`; browser mengirim cookie HttpOnly `access_token`, bukan JWT di URL.
- URL dibentuk dari origin API (HTTP→WS, HTTPS→WSS). `NEXT_PUBLIC_WS_RELAY_URL` hanya dipakai bila hostname dan skema aman sama dengan origin API — cookie host-only tidak berlaku di subdomain lain. Reconnect backoff terbatas; tiap koneksi memeriksa sesi via `/api/auth/me`; sesi invalid menghentikan retry.
- Jangan hidupkan SSE atau `/logs/stream-auth` hanya karena dokumentasi lama menyebutnya.
- `next.config.ts` mengekspos `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) dan rewrite `/api/:path*` → `http://api:8000/api/:path*`. Host `api` adalah DNS Docker.
- Cookie backend Secure + SameSite=None tanpa Domain. Jangan lemahkan cookie/CORS untuk menutupi salah routing.
- Security headers/CSP ada di `next.config.ts` dan `src/proxy.ts`; keduanya mengizinkan tile `https://*.tile.openstreetmap.org`. Jangan buka seluruh `https:` demi peta.

## Perilaku halaman

Registrasi publik hanya menawarkan mahasiswa dan Dosen PA; keduanya pending. Pilihan admin tidak tersedia dan ditolak backend.

Monitoring memakai `cluster_name` dan `distraction_score` dari backend; event tanpa hasil model mempertahankan hasil terakhir atau "belum dinilai". Tidak ada rumus skor lokal; klaster 0 bukan berarti rendah.

Dashboard memakai `useApiResource` untuk summary, tren, lokasi, dan model secara independen. Refresh mempertahankan data berlabel "sedang diperbarui"; kegagalan mengosongkan panel terkait dengan retry. Empat kartu utama: mahasiswa terdaftar, sudah sinkron, belum sinkron, rerata waktu layar hari ini. Periode sinkronisasi mengikuti rentang backend, bukan minggu kalender. Grafik membaca `cluster_counts` dinamis dan menyediakan tabel; jumlah hasil pengelompokan lintas tanggal **bukan** jumlah mahasiswa unik. Lokasi menghitung log pada jadwal kuliah, bukan presensi.

Laporan memakai `avg_distraction_score`, `cluster_labels`, `cluster_counts` dinamis. Rentang minggu awal Senin–Minggu WITA; perpindahan filter membatalkan request lama dan mengosongkan hasil.

AI Analisis: contoh pertanyaan, panel konteks dengan retry, Markdown, salin jawaban, konfirmasi percakapan baru. Pertanyaan gagal/dibatalkan kembali ke kolom pesan; error tidak masuk riwayat. Kontrak backend maks 50 pesan dan 4.000 karakter/pesan: client mengirim instruksi + 48 pesan terakhir + pertanyaan baru. Riwayat hanya di state halaman. Tombol Hentikan memanggil `preventDefault` sebelum memulihkan draf — React memakai ulang kontrol button→submit, jadi klik batal tidak boleh mengirim ulang.

Halaman Mahasiswa: `useApiResource`, pencarian debounced, pagination, pembatalan respons lama, error/retry. Kartu/filter kelompok dari `cluster_distribution`, label dari `/api/models/history`. Distribusi adalah data pelatihan, bukan jumlah mahasiswa unik.

Ekspor CSV/Excel menetralkan awalan formula pada teks pengguna; angka negatif tetap numerik. HTML cetak meng-escape label dan nama institusi.

## Komponen yang dipakai ulang

| Lokasi | Pemakaian |
| --- | --- |
| `src/components/ui/` | Button, input, dialog, sheet, select, table, dropdown, sidebar, tooltip, skeleton. |
| `src/components/metrics/` | MetricCard, SectionHeader, PageHeader, status, ClusterBadge. |
| `src/components/charts/` | Grafik dashboard, tooltip editorial. |
| `src/components/layout/` | AppSidebar, Header, PublicHeader, MobileBottomNav, AcademicFilterBar. |
| `src/components/layout/navigation.ts` | Label dan ikon Lucide bersama. |
| `src/hooks/use-api-resource.ts`, `src/components/ui/data-state.tsx` | Loading independen, pembatalan, error/retry, empty-state. |
| `src/components/auth/` | AuthGuard, RoleGate, STAFF_ROLES, AccessDenied. |
| `src/components/notifications/notification-panel.tsx` | Panel notifikasi. |
| `src/components/theme-toggle.tsx` | Preferensi tema, `THEME_INIT_SCRIPT`. |
| `src/components/maps/here-map.tsx` | `HereMapPicker`; implementasinya Leaflet/OSM, bukan HERE SDK. |
| `src/hooks/use-dirty-state.ts`, `src/hooks/use-save-state.ts` | Status perubahan form dan penyimpanan. |
| `src/lib/palette.ts`, `src/lib/campus.ts`, `src/lib/limits.ts`, `src/lib/i18n.ts` | Nilai/pemetaan bersama; baca sebelum menambah literal. |

Cari ekspor aktual sebelum memakai simbol. Nama lama seperti GlassCard bukan alasan mengembalikan glassmorphism.

## Sistem visual

Sumber kebenaran: `src/app/globals.css`, `src/app/layout.tsx`, primitive yang dipakai. Workspace staf bergaya akademik modern: paper/ink, aksen Tailwind red-600, kartu radius 14 px, judul tegas, metrik mudah dibaca. Font: Montserrat (judul), Inter (isi), Fraunces (aksen), JetBrains Mono (angka). `.dashboard-shell` membatasi perubahan agar halaman publik tetap editorial. Grid metrik auto-fit minimum 14rem, kontrol minimum 44 px, tab membungkus di layar kecil. Ikon Lucide stroke 1.8. Badge klaster memakai nama lengkap tanpa animasi ping, "Belum dinilai" untuk hasil kosong. Status tidak boleh bergantung pada warna saja.

Tema `light`/`dark`/`system` disimpan sebagai `monitor-ung-theme`; `THEME_INIT_SCRIPT` dipasang sebelum paint untuk mencegah flash. Jaga konsistensi SSR/hydration.

## Aturan UX

- UI dan pesan berbahasa Indonesia. Bedakan kosong, nol, belum ada model, offline, gagal memuat.
- Navigasi desktop: sidebar manual dengan ikon + label; mode ciut memakai tooltip hover/fokus, tanpa auto-collapse. Mobile staf lima tujuan: Ringkasan, Mahasiswa, Pemantauan, Laporan, Akun; nonstaf hanya Akun. Safe-area bawah dan `aria-current`.
- Pencarian header dan Ctrl/Cmd+K memakai satu Dialog Base UI: halaman + mahasiswa, Tab/panah/Enter, Escape, pemulihan fokus. Pencarian mahasiswa memakai `apiFetch` dengan debounce dan AbortSignal.
- Pertahankan ruang bawah nav mobile, `min-w-0`, pembungkus tabel/overflow, panel responsif. Jangan sembunyikan data hanya agar tidak overflow.
- Label form terlihat, error dekat field, nama aksesibel untuk icon button, focus ring, keyboard nav, pengelolaan fokus dialog.
- Loading, sukses/gagal simpan, konfirmasi destruktif, dan retry. Pakai skeleton, empty-state, Sonner, hook form existing.
- Gunakan AbortSignal untuk request yang bisa digantikan; jangan tampilkan respons lama sebagai state terbaru.
- Pertahankan `prefers-reduced-motion`. Animasi bukan satu-satunya penjelas perubahan.
- Kontras, keyboard, screen reader, layar kecil wajib diverifikasi pada UI yang diubah; memory ini tidak menyatakan audit WCAG lulus.

## Pemeriksaan dan operasi

Dari `website/`:

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

Build memakai font Google sehingga bergantung jaringan. Tidak ada script `test` di `package.json`.

Pemeriksaan terfokus:
- `node scripts/regression-check.cjs` — refresh, logout/cache, lifecycle WebSocket, ekspor CSV, batas minggu WITA.
- `node scripts/dashboard-ui-check.cjs` — animasi metrik, pembatalan data, loading/retry, label klaster dinamis, alur AI. Node dengan hook/API tiruan, bukan pengganti browser.
- `scripts/workspace-browser-check.cjs` — Playwright/Chromium dari direktori alat sementara (tidak masuk `package.json`). Mengintersep semua API/WS dengan data sintetis dan menolak host non-loopback. Butuh server frontend lokal:

```bash
NODE_PATH=/tmp/monitor-ung-ui-check/node_modules node scripts/workspace-browser-check.cjs
```

`UI_BASE_URL` default `http://127.0.0.1:3100`; `UI_EVIDENCE_DIR` default `/tmp/monitor-ung-overhaul-evidence`.

Smoke publik cepat: `/`, `/login`, `/privacy`, `/changelog`, `/register`, `/api/status` harus 200; `/api/auth/me` tanpa sesi 401. Probe `urllib` tanpa konteks browser bisa menerima 403 dari Cloudflare — jangan simpulkan layanan mati dari satu client probe.

## Performance (terpasang)

- `public/ung-logo.webp` 13.882 B (192×192 WEBP q88). Sumber lama 2000×1995 / 137 KB hanya dirender maks 40 CSS px; biaya decode membuat optimasi `/_next/image` dingin 3–15 s. Jangan ganti dengan resolusi besar.
- `public/vercel.webp` dihapus (duplikat byte-identik, nol referensi).
- `next.config.ts`: satu aturan `headers()` untuk `/_next/static/chunks/:path*` dengan `public, max-age=300, must-revalidate`. **Sengaja tidak dinaikkan** — komentarnya mencatat tradeoff chunk basi di Firefox. Next memakai match pertama; jangan menambah blok duplikat.
- HTML memakai `no-cache, no-store` pada 17 blok untuk mencegah UI basi setelah rebuild.
- 39 `@font-face`, ~438 KB subset latin, `preload: false` + `display: swap`. Trimming butuh keputusan desain.
- Payload gzip per route: `/` 181 KB JS + 29 CSS + 13 HTML; `/dashboard` 291/29/4 (20 chunk); `/models` 319/29/4 (23 chunk). `0cz1d0mv5g_q7.js` adalah polyfill `noModule` yang tidak diambil browser modern.
- Origin VPS ~5 ms; keluhan lambat berasal dari RTT Cloudflare 0,3–3 s. Nginx VPS `/etc/nginx/nginx.conf` (2026-11-17) kini `gzip on` + `gzip_vary on` + `gzip_proxied any` + `gzip_comp_level 6` + `gzip_types` (JSON/JS/CSS/SVG); sebelumnya hanya `gzip on` sehingga API JSON tidak terkompresi di leg origin↔Cloudflare. Brotli **sengaja tidak dipasang** — Cloudflare sudah Brotli ke browser, jadi menambah modul di origin nyaris tanpa manfaat. Backup config: `/etc/nginx/nginx.conf.bak-*`.
- `next.config.ts` memakai `images: { unoptimized: true }` (2026-11-17). Semua `<Image>` kecil dan sudah pas ukurannya, jadi optimizer `sharp` tidak dipanggil saat runtime. Konsekuensi: gambar besar baru harus dioptimasi manual sebelum dipakai.
- `src/app/layout.tsx` menetapkan `metadataBase` dari `NEXT_PUBLIC_SITE_URL` (default `https://monitorterop.my.id`). Tanpa itu aset OG di-resolve ke `localhost:3000` saat build dan muncul warning.
- `src/app/opengraph-image.tsx` dirender statis saat build (○), bukan `runtime = "edge"`. Renderer `next/og`/satori **tidak mendukung warna `oklch()`** — build gagal `Unexpected token type: function` jika dipakai. Pakai hex/rgba di file itu.

## Deploy

Production VPS `root@213.163.207.199`, `/opt/monitorung`:

```bash
docker compose --env-file .env.production -f docker-compose.yml -f compose.vps.yml build web
docker compose --env-file .env.production -f docker-compose.yml -f compose.vps.yml up -d --no-deps --wait web
```

Saat mengubah aset di `public/`, verifikasi ukuran **di dalam container** (`docker exec monitorung-web ls -l public/<file>`), bukan hanya di host — pernah terjadi rsync mendarat di direktori salah sehingga image dibangun dari aset lama.

Status 2026-11-17 (deploy migrasi proxy, setelah optimalisasi RAM): `monitorung-web:latest` `sha256:56f0bbb35f09…`, container healthy, `/`, `/login`, `/opengraph-image` 200. Rollback di VPS: `monitorung-web:pre-proxy` `sha256:03a6d862e517…` dan `monitorung-web:rollback` `sha256:d5875b2048…`; rollback lewat `docker tag` + `up -d --no-deps --wait web`. API pasangannya `monitorung-api:latest` `sha256:2ba98c96055a…`. Build web bersih: warning `middleware deprecated` dan `Edge Runtime deprecated` hilang setelah migrasi ke `src/proxy.ts` + penghapusan `runtime = "edge"` di OG image; warning `Custom Cache-Control headers` tetap ada dan disengaja.

## Batas verifikasi

Pemeriksaan browser memakai API sintetis dan bypass CSP; smoke test publik memakai layanan asli. Ini tidak membuktikan cookie/API/CSP production, training model nyata, atau jawaban Groq nyata. Pengujian screen reader manual dan audit WCAG menyeluruh belum dilakukan. Jangan anggap accessibility tree sebagai pengujian screen reader.
