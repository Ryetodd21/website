<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Memory Website Monitor UNG

Snapshot kode: 2026-11-13. Berlaku untuk `/home/terio-op/website`. Baca juga [memory proyek](../AGENTS.md), [backend](../server/AGENTS.md), dan [Android](../monitor-ung-app/AGENTS.md) ketika kontrak lintas komponen berubah. Blok Next.js di atas tetap dipertahankan.

## Tujuan dan stack

Website menyediakan halaman publik serta dashboard staf untuk membaca distraksi belajar mahasiswa, mengelola akademik dan institusi, memantau log, melatih/membaca model, meninjau laporan, dan menggunakan AI Analisis. Mahasiswa diarahkan ke Android untuk pengumpulan aktivitas; profil web tersedia bagi pengguna authenticated.

Versi sumber `package.json`: Next.js 16.3.5, React/React DOM 19.2.8, TypeScript 5, Tailwind CSS 4, ESLint 9. UI memakai shadcn `base-nova` dengan `@base-ui/react` 1.8+, bukan asumsi semua primitive berbasis Radix. Ada lucide-react, Recharts 3, Leaflet 1.9, Sonner, react-markdown/remark-gfm, class-variance-authority dan tw-animate-css. Gunakan dependency terpasang; tidak ada kebutuhan menambah library UI untuk pola yang sudah tersedia.

Next.js App Router berada di `src/app/`; alias `@/*` menuju `src/*`. Next menghasilkan output `standalone`. `package-lock.json` adalah lockfile npm. README masih template create-next-app, bukan dokumentasi arsitektur yang dapat diandalkan.

## Halaman dan perjalanan pengguna

| Route | Peran |
| --- | --- |
| `/` | Landing publik di `src/app/_components/landing-view.tsx`; manfaat untuk mahasiswa/dosen/admin, prinsip data, alur persetujuan sampai pendampingan, fitur dan tim. |
| `/login`, `/register` | Masuk dan pendaftaran publik; backend memutuskan role/aktivasi. |
| `/privacy`, `/changelog` | Informasi privasi dan perubahan; data changelog di `src/app/changelog/_components/_data.ts`, metadata versi/tanggal di `src/app/changelog/page.tsx`. Rilis terbaru v0.29.0, 13 November 2026. |
| `/dashboard` | Ringkasan metrik dan grafik. |
| `/monitoring` | Pemantauan mahasiswa, aktivitas dan konteks lokasi. |
| `/students` | Daftar/pengelolaan mahasiswa serta hasil klaster. |
| `/logs` | Riwayat/log aktivitas, filter dan pembaruan stream. |
| `/models` | Konfigurasi/model, training, versi dan visualisasi hasil. |
| `/reports` | Rekap dan tren. |
| `/ai` | Percakapan analisis melalui backend Groq. |
| `/akademik` | Data akademik, jadwal dan request terkait. |
| `/settings` | Pengaturan institusi, kampus/pengguna dan konfigurasi terkait sesuai akses API. |
| `/profile` | Profil pengguna sendiri. |

Route dashboard berada dalam grup `(dashboard)`; nama grup bukan bagian URL. Layout bersama menggabungkan `AuthGuard`, `InstitutionProvider`, `UserProfileProvider`, `SidebarProvider`, sidebar, header, konten, shortcut help dan navigasi mobile. Theme toggle berada di header; tidak lagi mengambang di atas navigasi mobile. `loading.tsx` menyediakan skeleton perpindahan halaman.

`STAFF_PATH_PREFIXES` pada `src/app/(dashboard)/layout.tsx` mencakup semua route staf di tabel kecuali `/profile`. `STAFF_ROLES` adalah `admin`, `dosen`; mahasiswa mendapat tampilan akses terbatas. Detail izin per operasi harus mengikuti backend, bukan menganggap dosen boleh melakukan seluruh tindakan pada halaman yang bisa dibuka.

## API, auth, dan sumber state

1. `src/lib/api.ts` adalah pusat request dan tipe response. Gunakan fungsi yang ada atau `apiFetch<T>`; jangan membuat client paralel per halaman.
2. Browser mengirim `credentials: "include"`; token tidak disimpan di localStorage/sessionStorage. Theme atau cache profil institusi yang tidak berupa kredensial boleh memakai penyimpanan lokal sesuai pola existing.
3. `apiFetch` mencoba refresh saat 401 di luar endpoint auth tertentu. Promise `refreshInFlight` menyatukan refresh bersamaan; retry memakai access token baru pada header. Hanya refresh 401 mengarah ke login. Gangguan jaringan, 429/5xx, timeout, atau respons rusak menghasilkan error yang bisa dicoba lagi; AuthGuard menampilkan retry tanpa memaksa login.
4. `noRedirect` digunakan pada request publik yang tidak boleh memaksa login. Tangani `AbortError` dan `RedirectError` tanpa toast error palsu ketika request dibatalkan atau navigasi berjalan.
5. Response 204 menghasilkan `undefined`; error Pydantic/HTTP dinormalisasi dari `detail`. Jangan menganggap seluruh kegagalan selalu string sederhana.
6. `getCurrentUser()` memakai `apiFetch` dengan `noRedirect`, lalu mengembalikan null saat gagal. Login dan logout header memakai helper bersama. Logout hanya menavigasi setelah API berhasil; cache profil dibersihkan dan subscriber diberi notifikasi. Login sukses juga membersihkan cache akun sebelumnya. Profil server mengganti field kosong dengan default, bukan mempertahankan data pribadi akun lama.

`AuthGuard` menangani sesi UI; `RoleGate` memeriksa role. Saat role belum diketahui, RoleGate default dapat merender optimistis. Data sensitif tetap wajib dilindungi endpoint. `src/middleware.ts` memasang security headers dan bukan autentikator dashboard.

`src/lib/user-profile.tsx` menyediakan profil untuk header/sidebar/page. `src/lib/institution.tsx` mengambil dan menyimpan profil institusi lewat API, dengan cache lokal `institution_profile_v1`; ada pemetaan snake_case/camelCase dan pembacaan logo maksimum 2 MB. Jangan mengubah konfigurasi server menjadi state lokal saja.

## Realtime dan jaringan

- `subscribeLogsStreamWebSocket` di `src/lib/api.ts` menerima event JSON dan mengembalikan cleanup. Panggil cleanup ketika unmount; jangan membuat stream ganda atau reconnect timer yang tertinggal.
- Path stream aktif `/api/logs/stream/ws`; browser mengirim cookie HttpOnly `access_token`, bukan JWT di URL.
- URL stream dibentuk dari origin API (HTTP menjadi WS, HTTPS menjadi WSS). `NEXT_PUBLIC_WS_RELAY_URL` hanya digunakan jika hostname dan skema aman sama dengan origin API, karena cookie host-only tidak berlaku di subdomain lain. Reconnect memakai backoff terbatas, cleanup membatalkan timer; event connected/disconnected memperbarui indikator. Setiap koneksi/reconnect memeriksa sesi melalui /api/auth/me dan refresh HTTP bila diperlukan; sesi invalid menghentikan retry, cleanup membatalkan preflight.
- Jangan mengasumsikan SSE atau `/logs/stream-auth` tersedia karena dokumentasi lama menyebutnya. Implementasi client saat ini menggunakan WebSocket.
- `next.config.ts` mengekspos `NEXT_PUBLIC_API_URL`, default `http://localhost:8000`, serta rewrite `/api/:path*` ke `http://api:8000/api/:path*`. Host `api` adalah DNS Docker; bukan otomatis alamat backend yang dapat diakses proses Next lokal.
- Cookie backend sekarang Secure + SameSite=None tanpa Domain eksplisit. Keberhasilan login HTTP lokal atau WS lintas subdomain harus diverifikasi pada environment target; jangan melemahkan cookie/CORS untuk menutupi salah routing.
- Security headers/CSP ada pada `next.config.ts` dan `src/middleware.ts`. Keduanya mengizinkan tile `https://*.tile.openstreetmap.org` untuk pemilih kampus; jangan membuka seluruh `https:` demi peta.

Registrasi publik tetap menawarkan mahasiswa dan Dosen PA. Kedua pilihan membuat akun pending; pilihan admin tidak tersedia dan ditolak backend. UI persetujuan admin menampilkan role akun yang akan diaktifkan.

Monitoring memakai `cluster_name` dan `distraction_score` dari backend; event telemetri tanpa hasil model mempertahankan hasil terakhir atau menampilkan belum dinilai. Tidak ada rumus skor lokal atau asumsi klaster 0 selalu rendah. Laporan memakai `avg_distraction_score`, mapping `cluster_labels`, dan `cluster_counts` dinamis untuk filter, grafik, tabel, serta unduhan. Rentang minggu awal mengikuti Senin-Minggu WITA; perpindahan filter membatalkan request lama dan mengosongkan hasil. Kegagalan menampilkan error/retry, bukan angka dari filter sebelumnya.

Dashboard memakai `useApiResource` untuk memuat summary, tren harian/mingguan/bulanan, lokasi, dan model secara independen. Refresh mempertahankan data berlabel sedang diperbarui; kegagalan mengosongkan panel terkait dan menyediakan retry. Request lama dibatalkan saat digantikan atau unmount. Empat kartu utama: mahasiswa terdaftar, sudah sinkron, belum sinkron, rerata waktu layar hari ini. Periode sinkronisasi mengikuti rentang backend dari tujuh hari sebelum `summary.date` hingga tanggal tersebut, bukan minggu kalender. Data simulasi dipisahkan dalam rincian.

Grafik dashboard membaca `cluster_counts` dinamis, memakai warna tema, serta menyediakan tabel yang dapat dibuka. Jumlah hasil pengelompokan lintas tanggal bukan jumlah mahasiswa unik. Lokasi menghitung log pada jadwal kuliah, bukan presensi; persentase hanya memakai log dengan lokasi diketahui. Field backend `avg_unlock_count_today` saat ini dihitung dari jumlah baris log mobile per mahasiswa aktif hari ini; rincian dashboard melabelinya sebagai rerata log mobile, bukan frekuensi membuka kunci.

AI Analisis mempunyai contoh pertanyaan, panel konteks dengan retry, percakapan Markdown, salin jawaban, dan konfirmasi percakapan baru. Pertanyaan gagal/dibatalkan dikembalikan ke kolom pesan; error tidak masuk riwayat model. Pengiriman ganda dicegah; request dibatalkan saat meninggalkan halaman. Kontrak backend tetap maksimum 50 pesan dan 4.000 karakter per pesan: client mengirim instruksi, 48 pesan terakhir, dan pertanyaan baru; teks jawaban lengkap tetap tampil. Riwayat hanya tersimpan dalam state halaman. Model jawaban ditampilkan dari response, bukan nama hardcoded. Tombol Hentikan memanggil preventDefault sebelum memulihkan draf: React memakai ulang kontrol yang berubah dari button menjadi submit, sehingga klik pembatalan tidak boleh mengirim ulang pertanyaan.

Halaman Mahasiswa memakai useApiResource untuk pencarian debounced, pagination, pembatalan respons lama, serta error/retry. Kartu/filter kelompok berasal dari cluster_distribution dan label model aktif dari /api/models/history, dengan fallback nomor kelompok; tidak mengunci tiga kelas atau memberi label mahasiswa "bermasalah". Distribusi adalah data pelatihan model, bukan jumlah mahasiswa unik. Total mengikuti filter API. Status koneksi palsu dihapus. Empty-state berada di luar tabel agar terbaca pada layar kecil; unduhan menggunakan nama field response aktual.

Ekspor CSV/Excel menetralkan awalan formula pada teks pengguna; angka negatif tetap numerik. HTML cetak meng-escape label dan nama institusi. Bantuan pintasan memakai Dialog Base UI existing agar fokus masuk, terkurung, dan kembali ke pemicu.

## Peta komponen yang digunakan ulang

| Lokasi | Pemakaian |
| --- | --- |
| `src/components/ui/` | Button, input, dialog, sheet, select, table, dropdown, sidebar, tooltip, skeleton dan primitive lain. |
| `src/components/metrics/` | MetricCard, SectionHeader, PageHeader, status dan ClusterBadge/EditorialPill. |
| `src/components/charts/` | Grafik dashboard dan editorial tooltip. |
| `src/components/layout/` | AppSidebar, Header, PublicHeader, MobileBottomNav. |
| `src/components/layout/navigation.ts` | Label dan ikon Lucide bersama untuk sidebar, header, pencarian, dan navigasi mobile. |
| `src/hooks/use-api-resource.ts`, `src/components/ui/data-state.tsx` | Loading independen, pembatalan request, error/retry, serta empty-state dashboard dan konteks AI. |
| `src/components/auth/` | AuthGuard, RoleGate, STAFF_ROLES, AccessDenied. |
| `src/components/notifications/notification-panel.tsx` | Panel notifikasi. |
| `src/components/theme-toggle.tsx` | Preferensi tema, subscription, THEME_INIT_SCRIPT. |
| `src/components/maps/here-map.tsx` | `HereMapPicker`; implementasinya Leaflet/OpenStreetMap, bukan HERE SDK meskipun nama lama masih ada. |
| `src/hooks/use-dirty-state.ts`, `src/hooks/use-save-state.ts` | Status perubahan form dan penyimpanan. |
| `src/hooks/use-mobile.ts`, `src/lib/use-in-view.ts` | Responsivitas dan reveal saat masuk viewport. |
| `src/lib/palette.ts`, `src/lib/campus.ts`, `src/lib/limits.ts`, `src/lib/i18n.ts` | Nilai/pemetaan bersama; baca sebelum menambah literal baru. |

Cari ekspor aktual sebelum menggunakan simbol dari codebase map historis. Nama lama seperti GlassCard bukan alasan mengembalikan glassmorphism.

## Sistem visual aktual

Sumber kebenaran: `src/app/globals.css`, `src/app/layout.tsx`, primitive dan komponen yang sedang dipakai. Workspace staf memakai arah akademik modern: paper/ink, aksen Tailwind red-600, kartu radius 14 px, ruang antarbagian, judul tegas dan metrik mudah dibaca. Aturan `.dashboard-shell` membatasi perubahan agar halaman publik tetap mengikuti gaya editorial existing. Grid metrik memakai auto-fit minimum 14rem, angka JetBrains Mono, kontrol utama minimum 44px, tab membungkus pada layar kecil. Sidebar desktop kembali setinggi viewport tanpa offset header lama. Ikon Lucide memakai stroke 1.8; badge klaster mempertahankan nama lengkap, tanpa animasi ping, dan menampilkan "Belum dinilai" untuk hasil kosong. Panel notifikasi menyesuaikan viewport, termasuk target sentuh dan label aksi. Legenda grafik menggunakan teks netral agar warna seri tidak mengurangi kontras label.

| Lapisan | Aturan |
| --- | --- |
| Kanvas | `--paper`, `--ink`, `--hairline`, `--hairline-soft`; gunakan `bg-paper`, `text-ink`, `border-hairline`. |
| Warna | Primary red-600; tombol utama red-800 (hover red-900); tautan red-700, teks biasa yang sebelumnya biru memakai ink hitam. Dark mode memakai tautan red-300 dan ink terang untuk kontras. Success teal; warning amber; destructive fuchsia; info cyan. Token status online/pending/offline mempunyai pengecualian hijau/kuning/merah tersendiri. |
| Font | Inter untuk body/UI, Montserrat 800/900 untuk display, Fraunces 500/700 untuk aksen serif, JetBrains Mono untuk angka/ID/kode. Dimuat melalui next/font/google dengan display swap; preload global dinonaktifkan agar font dimuat saat digunakan, termasuk Inter dan JetBrains Mono. |
| Judul | `.display-sans`, `.display-sans-uc`, `.display-sans-black`; aksen `.display-italic`; label `.eyebrow`, `.eyebrow-sm`. |
| Panel | `.editorial-panel` dengan radius kecil; `.lift-*` dan shadow token tersedia untuk elevasi lembut. Larangan historis semua shadow tidak lagi menggambarkan CSS aktual. |
| Form/tindakan | `.editorial-input`, `.editorial-cta`, `.editorial-ghost`, atau house component yang mengimplementasikan pola tersebut. |
| Status/klaster | Titik dan teks, bukan hanya warna; gunakan ClusterBadge/EditorialPill sebelum menulis pemetaan baru. |
| Grafik | Recharts dengan palette bersama dan editorial tooltip; label klaster berasal dari model, bukan konstanta tiga kelas. |

Pertahankan desain existing; jangan mengganti font atau membuat design system baru hanya karena template skill menyarankan pilihan lain. Warna semantik bukan alasan mengisi semua panel dengan warna terang. UI Android lebih membulat dan playful; itu bukan spesifikasi radius website.

Landing memakai judul Monitor/Imato + UNG dua baris flex; label Gorontalo diposisikan absolut dalam padding tetap agar tidak menambah line box atau menggeser judul. Ilustrasi SVG hero berupa smartphone dan dashboard beraksen merah; dekorasi kotak tim dihapus, latar tim mengikuti brand tint. Konten tidak menjanjikan kehilangan data nol, bukti presensi dari lokasi, model AI tertentu, atau tiga klaster tetap. Hero tidak lagi memanggil endpoint model terproteksi untuk angka dekoratif.

Theme preference `light`, `dark`, `system` disimpan sebagai `monitor-ung-theme`. `THEME_INIT_SCRIPT` dipasang pada root sebelum paint, memperbarui `.dark` dan data attributes untuk mencegah flash tema salah. Pertahankan konsistensi SSR/hydration saat mengubah tema.

## Aturan UX untuk perubahan berikutnya

- UI dan pesan pengguna berbahasa Indonesia. Nilai kosong, nol, belum ada model, offline, dan gagal memuat harus dibedakan.
- Navigasi desktop memakai sidebar manual dengan ikon dan label; mode ciut memakai tooltip saat hover/fokus, tanpa auto-collapse. Menu dikelompokkan berdasarkan tugas. Mobile staf memakai lima tujuan: Ringkasan, Mahasiswa, Pemantauan, Laporan, Akun; akun nonstaf hanya melihat Akun. Navigasi mobile mempunyai safe-area bawah dan `aria-current`.
- Pencarian header dan Ctrl/Cmd+K memakai satu Dialog Base UI: halaman dan mahasiswa, pemilihan Tab/panah/Enter, Escape, serta pemulihan fokus. Pencarian mahasiswa memakai `apiFetch` dengan debounce dan AbortSignal. Aksi muat ulang benar-benar memuat ulang halaman; logout memakai helper auth bersama.
- Pertahankan ruang bawah untuk nav mobile, layout `min-w-0`, pembungkus tabel/overflow dan panel responsif. Jangan menyembunyikan data hanya agar tidak overflow.
- Gunakan label form yang terlihat, deskripsi error dekat field, nama aksesibel untuk icon button, focus ring, keyboard navigation, serta pengelolaan fokus pada dialog.
- Tampilkan loading, sukses/gagal simpan, konfirmasi tindakan destruktif dan retry yang relevan. Gunakan skeleton, empty-state, Sonner dan hook form existing.
- Gunakan AbortSignal untuk request yang dapat digantikan pencarian/filter berikutnya. Jangan menampilkan hasil respons lama sebagai state terbaru.
- Pertahankan `prefers-reduced-motion` pada CSS. Animasi dan angka bergerak tidak boleh menjadi satu-satunya penjelas perubahan.
- Status tidak boleh bergantung pada warna saja. Ini juga cocok dengan panduan UI/UX Pro Max kategori Accessibility/Color Only yang diperiksa untuk memory ini.
- Kontras, keyboard, screen reader dan layar kecil perlu diverifikasi pada UI yang diubah; memory ini tidak menyatakan audit WCAG sudah lulus.

## Pemeriksaan dan operasi

Jalankan dari folder `website/`:

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

`npm run start` menjalankan server production setelah build. Untuk perubahan UI/API, lint/typecheck/build sesuai cakupan, lalu cek halaman terkait pada desktop/mobile dan tema relevan. Build memakai font Google sehingga hasil dapat bergantung pada jaringan. Gunakan environment API development; jangan menyimpulkan kegagalan login selalu berasal dari form.

Tidak ada script `test` di package.json. Pemeriksaan terfokus: `node scripts/regression-check.cjs` untuk refresh, logout/cache, lifecycle WebSocket, ekspor CSV, serta batas minggu WITA. Regresi kontrak laporan/registrasi ada di `server/scripts/backend_regression_check.py` dengan DB sementara.

`node scripts/dashboard-ui-check.cjs` memeriksa animasi metrik (placeholder, durasi nol, reduced motion, cleanup), pembatalan data titik saat model aktif berganti, state loading/retry dan pembatalan request lama, label klaster/tabel dinamis, serta alur AI (pengiriman ganda, gagal/retry, batal, riwayat, batas input, komposisi teks). Ini pemeriksaan Node dengan hook/API tiruan, bukan pengganti pengujian browser.

Production memakai Docker Compose root dengan `--env-file /home/terio-op/.env.production`. Build `api web`, lalu `up -d --no-deps --wait api worker scheduler subscriber web` memperbarui kelima layanan aplikasi; buat backup DB dan simpan tag image lama sebelum deploy karena startup API menjalankan migrasi. Rilis v0.29.0 pada 2026-11-13 terverifikasi sehat; `/`, `/changelog`, `/login`, `/register`, `/api/status` merespons HTTP 200 dari host publik. Pemeriksaan ini tidak menggantikan pengujian login pengguna nyata.

## Serah terima overhaul UI/UX/ikon

Implementasi dilanjutkan dari overhaul existing untuk admin/dosen usia 30-50 tahun. Identitas paper/ink, font, komponen, dan kontrak API tetap dipertahankan. Cakupan isi utama: Ringkasan, AI Analisis, dan Mahasiswa; seluruh sepuluh menu staf/profil mendapat perbaikan komponen bersama. Tidak semua formulir dan subtab didesain ulang.

**Status 2026-11-13:** build production Turbopack dan TypeScript berhasil. Hambatan sandbox/build/browser sebelumnya tidak muncul lagi. Regresi `scripts/regression-check.cjs`, `scripts/dashboard-ui-check.cjs`, serta lint global dengan `--max-warnings 0` lulus: 0 error, 0 warning. Seluruh 19 error lama dan 27 warning tersisa sudah diperbaiki. Warning Next tentang middleware/Edge Runtime, metadataBase dan custom Cache-Control masih ada.

Pemeriksaan browser tersimpan di `scripts/workspace-browser-check.cjs`. Script memakai Chromium/Playwright yang sudah terpasang di direktori alat sementara, tanpa dependency baru pada package.json. Semua API dan WebSocket diintersep memakai data sintetis; script menolak host frontend selain loopback. Jalankan dari website setelah build dan server frontend lokal tersedia:

```bash
NODE_PATH=/tmp/monitor-ung-ui-check/node_modules node scripts/workspace-browser-check.cjs
```

Lokasi Playwright dapat diganti melalui NODE_PATH ke instalasi alat yang tersedia. UI_BASE_URL default http://127.0.0.1:3100; UI_EVIDENCE_DIR default /tmp/monitor-ung-overhaul-evidence; bukti palet merah sesi terbaru memakai /tmp/monitor-ung-red-evidence. Bukti screenshot light/dark desktop/mobile dan accessibility tree berada di direktori tersebut, bersifat sementara. Log pemeriksaan sesi: /tmp/monitor-ung-red-browser.log; log build: /tmp/monitor-ung-red-build.log; lint JSON: /tmp/monitor-ung-red-lint-final.json.

**Hasil browser:** sepuluh route dashboard/profil dan lima halaman publik (/, /login, /register, /privacy, /changelog) lulus pemeriksaan overflow pada 375/768/1024/1440px dalam light/dark. Tema sistem berubah mengikuti OS, reduced motion menonaktifkan animasi workspace, serta viewport 720x500 dengan density 2 mengemulasikan jendela 1440x1000 pada zoom 200%. Sidebar ciut/tooltip keyboard, pencarian, dialog Tab/Escape/pemulihan fokus, navigasi mobile dan panel notifikasi diuji. Sampel kontras label metrik terhadap kartu: 6,51:1 terang dan 7,84:1 gelap; ini bukan pengukuran seluruh warna halaman.

Ringkasan diuji pada loading, gagal sebagian, retry, nol/kosong, lokasi tidak diketahui dan klaster nonstandar. AI diuji pada contoh pertanyaan, kirim ganda, salin, error/retry, batal tanpa mengirim ulang, hapus percakapan dengan konfirmasi, dan retry konteks. Regresi Node juga membuktikan pembatalan request ketika halaman AI ditinggalkan. Mahasiswa diuji dengan kelompok keempat, kondisi kosong mobile, error/retry dan penghapusan status koneksi palsu. Palet computed style membuktikan primary red-600, tombol red-800, tautan red-700/light dan red-300/dark, serta teks biasa hitam/light dan ink terang/dark. Pemuatan akun pengaturan, peta async (klik, tutup, buka ulang), timestamp perangkat, serta logout gagal/sukses diuji. Screenshot grafik menunggu SVG selesai mengikuti ukuran kontainer. Tidak ada pageerror pada rangkaian browser akhir.

Perbaikan lint memakai tipe Student, clock di effect/hasil request, import Leaflet async dengan cleanup, dependency model berdasarkan ID, cleanup Set/timer milik subscription, penghapusan impor/state mati, serta Link/router untuk navigasi UI. API yang kehilangan sesi tetap melakukan navigasi penuh ke URL login same-origin agar state terlindungi dibuang; noRedirect tetap berlaku untuk halaman publik. Tidak ada aturan lint baru yang dinonaktifkan.

## Deploy revisi landing 2026-11-13

Revisi landing, palet merah, overhaul workspace, dan perbaikan lint diterapkan ke production melalui build image web serta `docker compose --env-file /home/terio-op/.env.production -p monitorung up -d --no-deps --wait web`. Container web healthy. Timestamp start API/worker/scheduler/subscriber/PostgreSQL tidak berubah; tidak ada migrasi DB.

Rollback image sebelum rilis: `monitorung-web:rollback-20261113-190735`. Image yang diterapkan: `sha256:d1451f4c6c2c3c0849d6dfa6d2634392fe9e8cde37a11bf4a8f597f189bd6278`. Simpan tag rollback sampai rilis dianggap stabil.

Pemeriksaan HTTP lewat browser pada domain publik: `/`, `/login`, `/register`, `/privacy`, `/changelog`, dan `/api/status` merespons 200. Request urllib tanpa konteks browser menerima 403; verifikasi publik dilakukan ulang melalui Chromium. Container preview lokal sudah dihentikan.

Lint global 0 error/0 warning, TypeScript, dua regresi Node, dan pemeriksaan browser image kandidat lulus. Landing diuji 320/375/768/1024/1440/1920px light/dark, termasuk tinggi judul stabil ketika bahasa berganti. Pengujian dialog menunggu fokus aktual siap, bukan jeda tetap sebelum menguji Tab. Browser publik dengan CSP asli membuktikan hero/konten baru, dekorasi tim hilang, CTA red-800, desktop/mobile dark, serta tidak ada pageerror. Bukti: `/tmp/monitor-ung-landing-evidence`; log build/deploy/browser di `/tmp/monitor-ung-landing-*.log`. Bukti sementara, bukan artefak repo.

## Investigasi WebSocket production 2026-11-13

Perbaikan preflight sesi WebSocket dan preload font telah deploy ke layanan web saja; container healthy. Lint 0 error/0 warning, TypeScript, regresi Node, dan browser 15 halaman lulus. Image: `sha256:68254cc8a46dee21cae1fd6dbbd690b172f8777a57466445d77b9314cce6d508`; rollback: `monitorung-web:rollback-ws-20261113-212412`. Log: `/tmp/monitor-ung-ws-build.log`, `/tmp/monitor-ung-ws-browser.log`, `/tmp/monitor-ung-ws-deploy.log`.

Browser publik mereproduksi HTTP 502 saat handshake `wss://monitorterop.my.id/api/logs/stream/ws`. Probe tanpa sesi ke API/Next lokal menghasilkan 403; rute melalui hostname MQTT yang menuju API langsung juga menghasilkan 403. Tidak memakai token pengguna atau mengubah otorisasi untuk probe. Konfigurasi tunnel aktif dari log Cloudflare hanya mengarahkan hostname utama ke `http://172.18.0.9:3000`, berbeda dari file lokal `.cloudflared/config.yml` yang sudah memiliki rute `^/api/.*` ke API. Konfigurasi remote menimpa file lokal.

Pengguna sudah menambahkan dan memindahkan rute hostname `monitorterop.my.id`, path `^/api/.*`, service `http://localhost:8000` sebelum rute web tanpa path; urutan terkonfirmasi dari konfigurasi runtime tunnel. Probe publik setelah perubahan masih HTTP 502 dengan body `Origin rejected: 403`, sedangkan probe anonim ke API lokal dan hostname MQTT HTTP 403. Ini mengindikasikan lapisan relay mengubah penolakan origin; konfigurasi Worker/rute domain belum diperiksa dan streaming staf terautentikasi belum diuji. Website dan /api/status HTTP 200. Credential connector lokal bukan bukti izin mengubah konfigurasi remote. Jangan melemahkan cookie, melewatkan RBAC, atau menaruh JWT di URL untuk mengatasi 502.

Font pada dua URL preload yang dilaporkan adalah Inter dan JetBrains Mono. Stylesheet `0n8kzvw2z_6as.css` berisi Leaflet; prefetch route Pengaturan dapat memuatnya sebelum dipakai. Peringatan stylesheet tersebut terpisah dari kegagalan WebSocket.

Tindak lanjut 2026-11-13: prefetch tautan Pengaturan pada sidebar/header dinonaktifkan untuk menghindari pemuatan CSS Leaflet sebelum navigasi; sudah deploy 2026-11-14. Probe Chromium publik anonim terbaru mendapat handshake 403 (close 1006), bukan 502; ini hanya membuktikan penolakan sesi kosong, bukan pemulihan stream staf. Menu Mahasiswa tidak berlangganan WebSocket; subscription Dashboard ditutup saat unmount.

## Deploy production dan distribusi APK 2026-11-14

Keempat unduhan APK publik dan SHA256SUMS.txt diverifikasi 200 dengan checksum sama seperti artefak lokal. Probe browser unduhan universal macet; verifikasi universal/x86_64 diselesaikan melalui curl. Halaman publik dan /api/status 200; POST refresh tanpa sesi/body 401.

Image API/web dibangun tanpa cache; layanan api/worker/scheduler/subscriber/web diperbarui dan healthy. Prefetch Pengaturan pada sidebar/header sudah dinonaktifkan dalam rilis ini. PostgreSQL, Redis, MQTT dan tunnel tidak direstart. Backend menerima refresh cookie tanpa body; sesi kosong mendapat 401, bukan 422. Tidak ada perubahan transport WebSocket pada rilis ini; sesi staf production belum diuji.

APK Android signed production 0.29.1 (versionCode 30) didistribusikan melalui `/downloads/monitor-ung-0.29.1-universal.apk`, serta varian `arm64-v8a`, `armeabi-v7a`, `x86_64`; `/downloads/SHA256SUMS.txt` menyimpan checksum. APK dimasukkan ke public assets image web. Detail pemeriksaan dan batas perangkat ada di memory Android.

Lint web, dua regresi Node, build/TypeScript, dan browser kandidat 15 halaman pada desktop/mobile light/dark lulus tanpa pageerror; API browser kandidat sintetis. Log `/tmp/monitorung-prod30-*.log`, bukti browser `/tmp/monitorung-prod30-browser-evidence`. Rollback image `monitorung-api:rollback-20261114` dan `monitorung-web:rollback-20261114`; backup DB terverifikasi dan manifest image di direktori privat `/home/terio-op/releases/20261114-production/`. Jangan salin direktori rilis privat ke public assets.

## Konfirmasi pengguna setelah migrasi UpCloud

Pada 2026-11-14 pengguna mengonfirmasi login nyata dan uji training sudah dilakukan setelah production berpindah ke VPS dan Managed PostgreSQL UpCloud. Ini bukti yang dilaporkan pengguna, bukan pengujian ulang oleh agen. Status deployment/database terbaru mengikuti root dan memory backend. Pengingat desktop lokal setiap 25 hari untuk backup serta persiapan migrasi VPS aktif, pertama 2026-12-09 pukul 09.00 WITA; detail mekanisme dan batasnya di root AGENTS.md.

## Batas verifikasi memory

Matriks dashboard memakai API sintetis dan bypassCSP untuk mengisolasi UI; smoke test landing production memakai layanan publik dan CSP asli. Hasil ini tidak membuktikan cookie/API/CSP produksi, training model nyata, atau jawaban Groq nyata. Overhaul 2026-11-13 hanya deploy web; rilis 2026-11-14 juga memperbarui backend dengan startup migrasi existing, tanpa seed. Pengujian pembaca layar manual dan audit WCAG menyeluruh belum dilakukan. Jangan menganggap pengecekan accessibility tree sebagai pengujian screen reader nyata.
