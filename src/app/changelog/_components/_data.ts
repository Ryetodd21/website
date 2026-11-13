// ─── Changelog data ──────────────────────────────────────────────────────
// Disimpan terpisah agar halaman publik /changelog dapat membagikannya
// dengan tampilan lain di masa depan (mis. widget ringkasan di landing).
// Bahasa mengikuti KBBI, tanpa em-dash, tanpa istilah asing kecuali English.

export type ChangeKind = "added" | "fixed" | "changed" | "removed";

export interface ChangeEntry {
  kind: ChangeKind;
  text: string;
}

export interface ChangelogVersion {
  version: string;
  date: string;
  highlight: string;
  changes: ChangeEntry[];
}

export interface ChangelogChannel {
  channel: string;
  title: string;
  blurb: string;
  versions: ChangelogVersion[];
}

export const CHANGELOG: ChangelogChannel[] = [
  {
    channel: "docker",
    title: "Docker · Compose",
    blurb:
      "Docker Compose dengan 9 service: PostgreSQL, Redis, FastAPI, RQ worker, " +
      "scheduler cron, MQTT broker, MQTT subscriber, Next.js, dan Cloudflare Tunnel.",
    versions: [
      {
        "version": "v0.29.0",
        "date": "13 November 2026",
        "highlight": "Pembaruan layanan production",
        "changes": [
          {
            "kind": "changed",
            "text": "Layanan API, worker, scheduler, subscriber, dan website diperbarui untuk menerapkan hasil audit November."
          }
        ]
      },
      {
        version: "v0.28.0",
        date: "12 Oktober 2026",
        highlight: "VPS relay dan build ulang image untuk audit Round 28",
        changes: [
          { kind: "changed", text: "Image monitorung-api dan monitorung-web dibangun ulang untuk menerapkan perubahan landing view (SSE menjadi WebSocket) dan indikator visual Android (hari ini vs 30 hari)." },
          { kind: "added", text: "Server VPS relay di 213.163.193.52 (sg-sin1.upcloud.host) dengan mosquitto 2.0.22, nginx 1.28.3, dan sertifikat Let's Encrypt dengan SAN ws.monitorterop.my.id agar koneksi WebSocket dapat melalui jalur langsung." },
        ]},
      {
        version: "v0.26.0",
        date: "10 Oktober 2026",
        highlight: "Image api dan web dibangun ulang untuk audit batch Round 26",
        changes: [
          { kind: "changed", text: "Image monitorung-api dan monitorung-web dibangun ulang dan dipaksa recreate untuk menerapkan perbaikan audit Round 26 yang terdiri dari 8 isu kritis dan 21 isu penting." },
        ]},
      {
        version: "v0.27.0",
        date: "10 Oktober 2026",
        highlight: "Endpoint WebSocket dan notifikasi push FCM",
        changes: [
          { kind: "added", text: "Cloudflared dikonfigurasi ulang untuk mendukung WSS (WebSocket over HTTPS) sehingga endpoint /api/logs/stream/ws dapat dijangkau melalui Cloudflare Tunnel." },
          { kind: "added", text: "Variabel lingkungan FCM_SERVICE_ACCOUNT_PATH dan FIREBASE_PROJECT_ID ditambahkan ke docker-compose untuk mengaktifkan notifikasi push Firebase Cloud Messaging." },
          { kind: "added", text: "Proxy nginx diatur dengan proxy_http_version 1.1, proxy_read_timeout 300s, dan proxy_buffering off untuk menopang koneksi WebSocket yang bertahan lama." },
        ]},
      {
        version: "v0.23.0",
        date: "7 Oktober 2026",
        highlight: "Batas memori Redis dan ambang autovacuum per-tabel",
        changes: [
          { kind: "changed", text: "Container Redis memakai --maxmemory 256mb dengan kebijakan allkeys-lru, menggantikan noeviction yang menolak penulisan saat beban puncak." },
        ]},
      {
        version: "v0.22.0",
        date: "7 Oktober 2026",
        highlight: "Ketahanan healthcheck di tiga service: subscriber, scheduler, dan web",
        changes: [
          { kind: "fixed", text: "Healthcheck service subscriber menggunakan file heartbeat /tmp/mqtt_subscriber_heartbeat yang disentuh setiap 5 detik oleh loop utama, menggantikan import modul Python lintas container yang tidak bisa diandalkan karena mqtt_client diset secara asinkron." },
          { kind: "fixed", text: "Healthcheck service scheduler menggunakan file heartbeat /tmp/scheduler_heartbeat yang disentuh setiap iterasi loop utama, menggantikan pemeriksaan file log /var/log/monitorung/scheduler.log yang sebelumnya gagal karena permission denied." },
          { kind: "fixed", text: "Healthcheck service web menggunakan wget bukan curl yang tidak tersedia di image Next.js, dan menggunakan 127.0.0.1 bukan localhost yang bisa resolve ke ::1 IPv6." },
        ]},
    ]},
  {
    channel: "server",
    title: "Server · FastAPI",
    blurb:
      "Backend Python 3.13, FastAPI, async SQLAlchemy, PostgreSQL, Redis, " +
      "broker MQTT Mosquitto, RQ worker, dan scheduler cron.",
    versions: [
      {
        "version": "v0.29.0",
        "date": "13 November 2026",
        "highlight": "Registrasi dosen dan laporan berdasarkan hasil tersimpan",
        "changes": [
          {
            "kind": "changed",
            "text": "Pendaftaran mahasiswa dan dosen tetap tersedia. Semua akun baru menunggu persetujuan admin; pendaftaran admin ditolak."
          },
          {
            "kind": "fixed",
            "text": "Rata-rata skor laporan memakai skor distraksi tersimpan dan mengabaikan nilai yang belum tersedia. Label klaster mengikuti model aktif."
          },
          {
            "kind": "fixed",
            "text": "Pesan MQTT memerlukan tanda tangan sesi yang valid. Sinkronisasi HTTP tetap mempertahankan pengakuan data per baris."
          }
        ]
      },
      {
        version: "v0.28.0",
        date: "12 Oktober 2026",
        highlight: "Penandaan throughput MQTT subscriber dan audit Round 28",
        changes: [
          { kind: "added", text: "Log INFO setiap 100 pesan MQTT yang diproses pada subscriber mqtt_subscriber.py untuk memonitor throughput produksi tanpa mengubah infrastruktur atau batching." },
        ]},
      {
        version: "v0.26.0",
        date: "10 Oktober 2026",
        highlight: "Audit batch: 8 isu kritis dan 11 isu penting diperbaiki",
        changes: [
          { kind: "fixed", text: "Fungsi submit_batch pada routers/logs.py NameError untuk variabel log_dates yang dipakai tiga kali tanpa pernah dideklarasikan; sinkronisasi Android dari Round 20 rusak selama 4 hari karena NameError ini. Sekarang variabel log_dates dibangun dari data.logs dengan himpunan unik." },
          { kind: "fixed", text: "Endpoint publik POST /api/users/register menerima peran dosen dari badan permintaan walaupun hanya admin yang seharusnya bisa membuat akun dosen. Sekarang peran selalu dipaksa ke mahasiswa saat pendaftaran publik." },
          { kind: "fixed", text: "Fungsi change_my_password dan admin PUT /api/users/{id} tidak menghapus baris token saat kata sandi diubah; token refresh yang bocor masih berlaku sampai 7 hari setelah rotasi kata sandi. Sekarang kedua endpoint menghapus baris token milik pengguna sebelum commit." },
          { kind: "fixed", text: "Worker pelatihan membatalkan semua ModelVersion lalu membuat ModelVersion baru; jika pelatihan gagal, jalur exception tidak mengaktifkan kembali ModelVersion yang sebelumnya sudah completed. Sekarang jalur exception mengaktifkan kembali ModelVersion completed paling baru agar laporan tetap memiliki model aktif." },
          { kind: "fixed", text: "Default peran pada Pydantic UserCreate adalah dosen; walau sudah di-force di router, default di skema tetap footgun. Sekarang default adalah mahasiswa." },
          { kind: "fixed", text: "Fungsi list_requests pada routers/schedule_request.py membangun count_q dengan hanya satu filter padahal kueri utama punya dua filter opsional; paginasi tampak benar padahal total tidak cocok. Sekarang count_q dibangun dari kueri utama yang sudah difilter." },
          { kind: "fixed", text: "Fungsi event_generator pada logs_stream kebocoran klien redis dan pubsub pada jalur error; tidak ada finally yang menutup sumber daya. Sekarang ada try/finally luar yang menutup pubsub dan klien redis di setiap jalur keluar." },
          { kind: "fixed", text: "Pipeline ML menggunakan SUM pada kolom total_screen_time_minutes, social_media_time_minutes, dan game_time_minutes padahal kolom sudah diagregasi harian; data seed berganda menggandakan nilai harian 8-20 kali. Sekarang kolom-kolom ini diagregasi dengan MAX." },
          { kind: "fixed", text: "Pipeline ML mengonversi used_during_class_int ke int() padahal nilainya 0 sampai 1; semua nilai di bawah 0.5 menjadi 0 dan 0.5 ke atas menjadi 1, menghilangkan gradasi. Sekarang nilai tetap float agar skor distraksi memiliki gradasi." },
          { kind: "fixed", text: "Worker pelatihan memiliki komentar Janji hapus hasil klaster lama tapi tidak ada DELETE; setiap pelatihan malam menambah baris baru tanpa menggantikan. Sekarang ada DELETE untuk student_id dan result_date yang akan dimasukkan." },
          { kind: "fixed", text: "Validator day_of_week pada jadwal_mata_kuliah menerima 0 sampai 6 dengan Minggu sama dengan 0; seluruh aplikasi lain memakai ISO 1 sampai 7. Sekarang validator menerima 1 sampai 7 dengan Senin sama dengan 1." },
          { kind: "fixed", text: "Endpoint GET /api/reports mengembalikan cluster_counts dengan kunci bilangan bulat dari label klaster; web membaca kunci PascalCase seperti Rendah. Sekarang hasil diproyeksikan melalui active_labels sehingga web menerima nama label." },
          { kind: "fixed", text: "Subscriber MQTT membuat baris AppLog tanpa source=mobile; default kolom adalah seed, sehingga UNIQUE INDEX parsial untuk source=mobile tidak pernah cocok dan jaminan satu baris per hari dari Round 20 rusak. Sekarang source=mobile dikirim secara eksplisit." },
        ]},
      {
        version: "v0.27.0",
        date: "10 Oktober 2026",
        highlight: "Endpoint WebSocket, notifikasi push FCM, dan perbaikan keamanan",
        changes: [
          { kind: "added", text: "Endpoint GET /api/logs/stream/ws untuk streaming real-time via WebSocket; frontend dasbor menggunakan WebSocket sebagai transport utama dengan exponential backoff untuk reconnnect." },
          { kind: "added", text: "Modul app/fcm.py mengirim notifikasi push via Firebase Cloud Messaging; service diaktifkan jika FCM_SERVICE_ACCOUNT_PATH disetel, fallback graceful jika tidak." },
          { kind: "added", text: "Kolom users.fcm_token menyimpan token perangkat untuk pengiriman notifikasi push." },
          { kind: "added", text: "Middleware keamanan di web menetapkan enam header (HSTS, CSP, X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy) pada semua rute termasuk halaman statis yang di-render sebelumnya." },
          { kind: "fixed", text: "Endpoint GET /api/models/history tidak memiliki autentikasi; sekarang memerlukan depends(require_admin_or_dosen) sehingga hanya admin dan dosen yang dapat membaca 23 versi model dengan inertia, silhouette_score, dan dataset_size." },
          { kind: "fixed", text: "Token refresh tidak dicabut saat kata sandi diubah; token yang dicuri tetap berlaku sampai 7 hari. Sekarang perubahan kata sandi menghapus semua baris token milik pengguna." },
        ]},
      {
        version: "v0.23.0",
        date: "7 Oktober 2026",
        highlight: "Preflight CORS cache, batas muatan MQTT, autovacuum per-tabel",
        changes: [
          { kind: "changed", text: "Middleware CORS mengirim Access-Control-Max-Age 3600 agar peramban menyimpan hasil preflight satu jam, mengurangi OPTIONS yang berulang di dasbor polling ketat." },
          { kind: "changed", text: "Broker Mosquitto menetapkan max_packet_size dan message_size_limit 65536 byte untuk mencegah muatan besar menggangu pelanggan MQTT python." },
          { kind: "added", text: "Fungsi run_autovacuum_tuning_migrations pada database.py menyetel ambang autovacuum per-tabel (login_devices, tokens, app_logs 0.05; cluster_results 0.10) sehingga tabel kecil yang sering berubah tidak lagi menggumpal." },
          { kind: "added", text: "Field error_message pada ModelVersionResponse sehingga dasbor dapat menampilkan alasan kegagalan pelatihan seperti data tidak cukup." },
        ]},
      {
        version: "v0.22.0",
        date: "7 Oktober 2026",
        highlight: "Validasi jadwal akademic dan agregasi unlock_count diperbaiki",
        changes: [
          { kind: "fixed", text: "Kolom unlock_count di pipeline ML dikumpulkan dengan MAX bukan SUM karena nilai unlock_count bersifat kumulatif per hari, bukan delta per interval." },
          { kind: "fixed", text: "Validasi ScheduleRequest.day_of_week sekarang menolak nilai di luar rentang 1 sampai 7, dan waktu start_time serta end_time harus mengikuti format HH:MM." },
          { kind: "fixed", text: "Parser waktu ScheduleRequest salah membagi string HH:MM tanpa pemisah colon; baris 31 menggunakan v[:2] dan v[2:] yang tidak memisahkan jam dan menit. Sekarang menggunakan v.split(':') untuk memproses format yang benar." },
        ]},
      {
        version: "v0.21.0",
        date: "6 Oktober 2026",
        highlight: "Dedup log mobile per mahasiswa per hari, perbaikan migrasi, perbaikan halaman ringkasan harian",
        changes: [
          { kind: "fixed", text: "Endpoint GET /api/logs/history memakai window function ROW_NUMBER() PARTITION BY (student_id, DATE(log_date)) ORDER BY log_date DESC, id DESC untuk mengembalikan tepat satu baris per mahasiswa per hari untuk data mobile." },
          { kind: "fixed", text: "Kolom source='mobile' di-query dengan operator = bukannya LIKE; sebelumnya baris dengan source literal 'mobile' (termasuk tanda kutip sebagai bagian dari nilai) tidak tampil." },
          { kind: "fixed", text: "Migrasi idempoten _dedupe_mobile_app_logs_postgres: klausa GROUP BY menggunakan a.log_date (bukan DATE(a.log_date)) agar PostgreSQL tidak mengeluh tentang kolom tidak ter-group; ON CONFLICT (id) DO NOTHING dipindah setelah GROUP BY agar tidak terjadi kesalahan sintaks pada prepared statement." },
        ]},
      {
        version: "v0.18.0",
        date: "6 Oktober 2026",
        highlight: "ID unik harian per mahasiswa, UPSERT mobile, audit zona waktu dan integritas data",
        changes: [
          { kind: "added", text: "Partial UNIQUE INDEX pada (student_id, log_date) WHERE source='mobile' di tabel app_logs; setiap mahasiswa mobile memiliki tepat satu baris per hari." },
          { kind: "added", text: "Batch submit UPSERT per (student_id, log_date) untuk data mobile; sync yang tidak sengaja menggantikan data, bukan menambah baris kedua." },
          { kind: "added", text: "Migrasi idempoten mendeduplikatkan baris mobile yang ada (pertahankan terbaru, hapus sisanya) sebelum membuat INDEX." },
          { kind: "changed", text: "Penanggalan 'hari ini' pada dasbor dan laporan mengikuti zona waktu WITA; sebelumnya pukul 00.00-08.00 WITA dasbor menampilkan tanggal UTC kemarin sebagai 'hari ini'." },
          { kind: "changed", text: "Pengaksesan atribut Pydantic memakai model_fields publik, bukan __pydantic_fields__ privat." },
          { kind: "removed", text: "Fungsi on_message yang mati dan tidak pernah dipasang pada mqtt_subscriber.py dihapus." },
          { kind: "changed", text: "Pemilihan event loop memakai asyncio.get_running_loop() agar tidak usang pada Python 3.10 ke atas." },
          { kind: "added", text: "Persetujuan permintaan jadwal yang start_time atau end_time kosong ditolak dengan kesalahan 400; sebelumnya sistem diam-diam membuat jadwal palsu pukul 08.00-10.00." },
          { kind: "fixed", text: "Pengambilan atribut student.advisor pada pembuatan mahasiswa memakai kueri User eksplisit agar tidak gagal dengan MissingGreenlet." },
          { kind: "fixed", text: "Pemuatan eager subject, dosen, dan kampus pada enam titik akhir jadwal dan permintaan jadwal memakai selectinload; sebelumnya akses malas pada sesi async memicu kesalahan 500 atau N+1." },
          { kind: "changed", text: "Rerata buka kunci harian memakai hitungan mahasiswa aktif hari ini sebagai pembagi, bukan pembagi minggu lalu." },
          { kind: "fixed", text: "Perbandingan recorded_at pada log lokasi memakai datetime.fromisoformat dengan normalisasi zona waktu; perbandingan leksikal sebelumnya keliru untuk ISO 8601 tanpa zona waktu." },
          { kind: "added", text: "Autentikasi kata sandi pada broker Mosquitto; konfigurasi allow_anonymous=false dengan argon2id dan kredensial terbagi antara server dan aplikasi Android." },
        ]},
      {
        version: "v0.17.0",
        date: "5 Oktober 2026",
        highlight: "Audit zona waktu, integritas jadwal, autentikasi broker MQTT",
        changes: [
          { kind: "changed", text: "Penanggalan 'hari ini' pada dasbor dan laporan mengikuti zona waktu WITA; sebelumnya pukul 00.00-08.00 WITA dasbor menampilkan tanggal UTC kemarin sebagai 'hari ini'." },
          { kind: "changed", text: "Pengaksesan atribut Pydantic memakai model_fields publik, bukan __pydantic_fields__ privat." },
          { kind: "removed", text: "Fungsi on_message yang mati dan tidak pernah dipasang pada mqtt_subscriber.py dihapus." },
          { kind: "changed", text: "Pemilihan event loop memakai asyncio.get_running_loop() agar tidak usang pada Python 3.10 ke atas." },
          { kind: "added", text: "Persetujuan permintaan jadwal yang start_time atau end_time kosong ditolak dengan kesalahan 400; sebelumnya sistem diam-diam membuat jadwal palsu pukul 08.00-10.00." },
          { kind: "fixed", text: "Pengambilan atribut student.advisor pada pembuatan mahasiswa memakai kueri User eksplisit agar tidak gagal dengan MissingGreenlet." },
          { kind: "fixed", text: "Pemuatan eager subject, dosen, dan kampus pada enam titik akhir jadwal dan permintaan jadwal memakai selectinload; sebelumnya akses malas pada sesi async memicu kesalahan 500 atau N+1." },
          { kind: "changed", text: "Rerata buka kunci harian memakai hitungan mahasiswa aktif hari ini sebagai pembagi, bukan pembagi minggu lalu." },
          { kind: "fixed", text: "Perbandingan recorded_at pada log lokasi memakai datetime.fromisoformat dengan normalisasi zona waktu; perbandingan leksikal sebelumnya keliru untuk ISO 8601 tanpa zona waktu." },
          { kind: "added", text: "Autentikasi kata sandi pada broker Mosquitto; konfigurasi allow_anonymous=false dengan argon2id dan kredensial terbagi antara server dan aplikasi Android." },
        ]},
      {
        version: "v0.16.0",
        date: "1 Oktober 2026",
        highlight: "Riwayat log aktivitas, auto-provision mahasiswa, perbaikan koneksi",
        changes: [
          { kind: "added", text: "Endpoint baru GET /api/logs/history untuk mengambil log aktivitas terbaru dari database." },
          { kind: "added", text: "Fungsi _get_or_provision_student pada router jadwal: mahasiswa baru yang belum pernah sinkron dari Android otomatis dibuatkan baris Student agar jadwal tetap dapat dilihat." },
          { kind: "fixed", text: "Import get_current_user_id yang hilang pada logs.py menyebabkan NameError saat startup." },
        ]},
      {
        version: "v0.15.0",
        date: "28 September 2026",
        highlight: "AI Analisis server-side: 3 Groq key pool, model gpt-oss-120b",
        changes: [
          { kind: "added", text: "Pool 4 Groq API key di server (GROQ_API_KEY_1 sampai 4) dengan load-balance round-robin per permintaan." },
          { kind: "added", text: "Cadangan otomatis ke key berikutnya saat salah satu terkena rate limit 429; mencakup sampai semua key habis." },
          { kind: "changed", text: "Default model AI Analisis pindah dari llama-3.3-70b-versatile ke openai/gpt-oss-120b." },
          { kind: "removed", text: "Field groq_api_key pada badan permintaan /api/ai/chat. Sekarang server yang mengelola key, klien tidak perlu input." },
        ]},
      {
        version: "v0.14.0",
        date: "27 September 2026",
        highlight: "Endpoint aktivasi model ML manual",
        changes: [
          { kind: "added", text: "Endpoint PATCH /api/models/{id}/activate: mengaktifkan satu model, menonaktifkan model lain, dan menghapus cache Redis terkait." },
        ]},
      {
        version: "v0.12.0",
        date: "27 September 2026",
        highlight: "Sinkronisasi trio rerata dengan Android dan validasi live",
        changes: [
          { kind: "added", text: "Field trio rerata harian tetap tersedia, dengan verifikasi manual melalui curl pada titik akhir publik." },
        ]},
      {
        version: "v0.11.0",
        date: "27 September 2026",
        highlight: "Trio rerata harian: unlock count, sosial media, game",
        changes: [
          { kind: "added", text: "Field avg_social_media_time dan avg_game_time pada endpoint /api/reports untuk rentang tanggal terpilih." },
          { kind: "added", text: "Field avg_unlock_count_today, avg_social_media_time_today_min, dan avg_game_time_today_min pada endpoint /api/reports/summary." },
        ]},
      {
        version: "v0.10.0",
        date: "27 September 2026",
        highlight: "JWT access token dipersingkat, endpoint publik untuk pendaftaran",
        changes: [
          { kind: "changed", text: "Masa hidup JWT access token dipendekkan dari 60 menjadi 30 menit; refresh token tetap 7 hari." },
          { kind: "changed", text: "Endpoint GET /api/program-studi dibuka untuk publik agar formulir pendaftaran dapat memuat daftar prodi tanpa login." },
          { kind: "fixed", text: "Bug MQTT production: container subscriber ditambah agar broker Mosquitto benar-benar menerima pesan dari aplikasi Android." },
          { kind: "added", text: "Endpoint /api/fakultas, /api/jurusan, dan filter ?jurusan_id pada /api/program-studi untuk kaskade akademik." },
        ]},
      {
        version: "v0.9.0",
        date: "26 September 2026",
        highlight: "Tabel program_studi dan login_devices",
        changes: [
          { kind: "added", text: "Tabel program_studi dengan CRUD lengkap dan endpoint filter ?jurusan_id=." },
          { kind: "added", text: "Tabel login_devices untuk daftar perangkat login yang dapat dicabut oleh pemilik akun." },
          { kind: "added", text: "Endpoint /api/users/create-student agar peran dosen dapat membuat akun mahasiswa tanpa harus ke admin." },
          { kind: "fixed", text: "Bug AI 500 dari func.max() yang naif melabeli datetime; cast ke AwareDateTime ditambahkan." },
          { kind: "fixed", text: "NameError _IDENT_RE di database.py dengan mengangkat pola regex ke lingkup modul." },
        ]},
    ]},
  {
    channel: "ml",
    title: "Machine Learning · PCA + K-Means",
    blurb:
      "Pipeline PCA + K-Means berjalan di RQ worker dengan jadwal retraining " +
      "otomatis setiap malam pukul 23:00 WITA.",
    versions: [
      {
        version: "v0.28.0",
        date: "12 Oktober 2026",
        highlight: "Tidak ada perubahan algoritma; agregasi tetap utuh",
        changes: [
          { kind: "changed", text: "Pipeline PCA + K-Means tetap mengelompokkan social_media_time_minutes, game_time_minutes, dan unlock_count per mahasiswa per hari seperti versi sebelumnya." },
        ]},
      {
        version: "v0.26.0",
        date: "10 Oktober 2026",
        highlight: "Agregasi kolom diagregasi ulang dan gradien kelas dipakai",
        changes: [
          { kind: "fixed", text: "Pipeline menggunakan SUM pada kolom total_screen_time_minutes, social_media_time_minutes, dan game_time_minutes yang sudah diagregasi harian; data seed berganda menggandakan nilai harian 8-20 kali. Sekarang kolom diagregasi dengan MAX sehingga tidak ada penggandaan." },
          { kind: "fixed", text: "Pipeline mengonversi used_during_class_int ke int() padahal nilainya 0 sampai 1; nilai di bawah 0.5 menjadi 0 dan 0.5 ke atas menjadi 1. Sekarang nilai tetap float agar skor distraksi memiliki gradasi." },
        ]},
      {
        version: "v0.22.0",
        date: "7 Oktober 2026",
        highlight: "Agregasi unlock_count diperbaiki dari SUM ke MAX",
        changes: [
          { kind: "fixed", text: "Kolom unlock_count dikumpulkan dengan MAX bukan SUM karena nilai unlock_count bersifat kumulatif per hari, bukan delta per interval." },
        ]},
      {
        version: "v0.17.0",
        date: "5 Oktober 2026",
        highlight: "Tidak ada perubahan algoritma; agregasi tetap utuh",
        changes: [
          { kind: "changed", text: "Pipeline PCA + K-Means tetap mengelompokkan social_media_time_minutes, game_time_minutes, dan unlock_count per mahasiswa per hari seperti versi sebelumnya." },
        ]},
      {
        version: "v0.12.0",
        date: "27 September 2026",
        highlight: "Tidak ada perubahan algoritma; agregasi tetap utuh",
        changes: [
          { kind: "changed", text: "Pipeline PCA + K-Means tetap mengelompokkan social_media_time_minutes, game_time_minutes, dan unlock_count per mahasiswa per hari." },
        ]},
      {
        version: "v0.11.0",
        date: "27 September 2026",
        highlight: "Tidak ada perubahan algoritma; agregasi tetap utuh",
        changes: [
          { kind: "changed", text: "Pipeline masih mengelompokkan social_media_time_minutes, game_time_minutes, dan unlock_count per mahasiswa per hari seperti versi sebelumnya." },
          { kind: "added", text: "Agregasi harian tersedia untuk laporan rerata tanpa langkah preprocessing tambahan." },
        ]},
      {
        version: "v0.10.0",
        date: "27 September 2026",
        highlight: "Label klaster dinamis mengikuti jumlah K",
        changes: [
          { kind: "changed", text: "Backend tetap memetakan label Rendah, Sedang, Tinggi untuk sembarang nilai K; kunci cluster_id_label asli tetap dipertahankan." },
          { kind: "fixed", text: "Recap counts kini konsisten terhadap perubahan K dari K=3 ke K=4 dan seterusnya tanpa menunggu simpan ulang." },
        ]},
      {
        version: "v0.9.0",
        date: "25 September 2026",
        highlight: "Pipeline dilatih otomatis + serialisasi fitur",
        changes: [
          { kind: "added", text: "Scheduler cron 23:00 WITA memicu pelatihan ulang setiap malam." },
          { kind: "fixed", text: "Serialisasi JSON untuk kolom features pada worker.py." },
          { kind: "fixed", text: "Koreksi datetime tz-naif untuk PostgreSQL TIMESTAMP WITHOUT TIME ZONE." },
          { kind: "fixed", text: "Cadangan COALESCE result_date untuk log_date NULL di ml/pipeline.py." },
        ]},
    ]},
  {
    channel: "web",
    title: "Website · Next.js Dashboard",
    blurb:
      "Dashboard admin dan dosen dengan sistem desain editorial ala SAIC, " +
      "otentikasi cookie, RBAC, dan pemutakhiran WebSocket waktu nyata.",
    versions: [
      {
        "version": "v0.29.0",
        "date": "13 November 2026",
        "highlight": "Laporan akurat, sesi lebih tahan gangguan, dan aksesibilitas",
        "changes": [
          {
            "kind": "fixed",
            "text": "Monitoring dan laporan menampilkan skor dari server serta label klaster dinamis tanpa menebak risiko dari nomor klaster."
          },
          {
            "kind": "fixed",
            "text": "Gangguan sementara saat memperbarui sesi dapat dicoba lagi. Keluar akun menunggu respons berhasil dan membersihkan cache profil."
          },
          {
            "kind": "fixed",
            "text": "Koneksi waktu nyata dapat tersambung kembali dan indikator mengikuti status koneksi."
          },
          {
            "kind": "fixed",
            "text": "Perubahan filter laporan mengosongkan data lama; kegagalan menampilkan tindakan coba lagi. Rentang minggu mengikuti waktu WITA."
          },
          {
            "kind": "fixed",
            "text": "Unduhan CSV menetralkan formula pada teks. Peta kampus dapat memuat tile OpenStreetMap."
          },
          {
            "kind": "fixed",
            "text": "Dialog pintasan menjaga fokus keyboard. Kartu laporan pada layar kecil tidak lagi bertumpuk."
          }
        ]
      },
      {
        version: "v0.28.0",
        date: "12 Oktober 2026",
        highlight: "Landing view WebSocket, indikator visual Android, KBBI sweep",
        changes: [
          { kind: "changed", text: "Landing view: semua sebutan Server-Sent Events (SSE) diganti WebSocket pada PILLARS, STEPS, FEATURES, MARQUEE, dan TechStack. TechStack kini memuat entri WebSocket untuk Frontend (selain Backend) dan MQTT Mosquitto untuk Backend." },
          { kind: "removed", text: "Filter grayscale pada logo UNG di header publik serta foto tim dan kontributor di landing view, sehingga elemen visual tampil berwarna sesuai warna asli." },
        ]},
      {
        version: "v0.26.0",
        date: "10 Oktober 2026",
        highlight: "Audit batch: 1 isu kritis dan 8 isu penting diperbaiki",
        changes: [
          { kind: "added", text: "Berkas src/app/(dashboard)/error.tsx dan src/app/global-error.tsx untuk menangkap galat render di subtree dasbor dan root; tanpa ini galat render menampilkan layar putih permanen." },
          { kind: "added", text: "Middleware.ts menyetel enam tajuk keamanan untuk setiap permintaan: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. Tajuk ini andal diterapkan untuk halaman statis dan dinamis, tidak seperti headers() di next.config.ts yang dilewati untuk halaman yang dirender lebih dulu." },
          { kind: "fixed", text: "Tombol keluar hanya memanggil POST /api/auth/logout lalu window.location.href=/login; empat kunci localStorage (user_profile_v1, institution_profile_v1, notification_prefs, command-palette-recents) masih berisi PII pengguna sebelumnya. Sekarang logout menghapus semua kunci tersebut." },
          { kind: "fixed", text: "TrainingProgressCard menjadwalkan setTimeout(onComplete) tanpa membersihkan handle, sehingga navigasi cepat memicu setState pada komponen yang sudah dilepas. Sekarang handle disimpan di useRef dan dibersihkan pada pembongkaran useEffect." },
          { kind: "fixed", text: "Pengendali SSE monitoring menjadwalkan setTimeout untuk menghapus penanda log baru tanpa membersihkan handle; navigasi cepat memicu setState pada komponen yang sudah dilepas. Sekarang semua handle disimpan di useRef Set dan dibersihkan pada pembongkaran." },
          { kind: "fixed", text: "use-save-state menjadwalkan setTimeout untuk membersihkan indikator saved tanpa membersihkan handle; simpan berurutan membuat penanda berkedip atau tetap terlalu lama. Sekarang handle disimpan di useRef dan dibatalkan pada simpan berikutnya." },
          { kind: "fixed", text: "Penghitung tutup pada app-sidebar dijadwalkan pada handleMouseLeave tanpa useEffect cleanup; navigasi cepat memanggil setOpen pada konteks sidebar halaman berikutnya. Sekarang ada useEffect cleanup yang membersihkan handle." },
          { kind: "fixed", text: "sseAuthPromise pada lib/api.ts disimpan di tingkat modul dan tidak pernah di-reset, sehingga setelah keluar akun EventSource terbuka dengan kuki pengguna sebelumnya sampai halaman dimuat ulang. Sekarang janji di-reset pada .finally sehingga panggilan berikutnya menjalankan POST ulang." },
          { kind: "fixed", text: "Fungsi saveProfile hanya memanggil setProfile; setelah simpan, draf masih berisi nilai yang diketik, sehingga indikator Perubahan belum disimpan tetap terlihat untuk satu render. Sekarang draf dan profil disetel bersamaan dengan objek next yang sama." },
        ]},
      {
        version: "v0.27.0",
        date: "10 Oktober 2026",
        highlight: "Live monitoring WebSocket, FCM push notification dengan fallback, audit Round 26 selesai",
        changes: [
          { kind: "added", text: "Endpoint WebSocket GET /api/logs/stream/ws menggantikan Server-Sent Events untuk live activity feed di dasbor. Sambungan upgrade HTTP/1.1 ke protokol RFC 6455, format pesan JSON sama dengan SSE sehingga klien tidak perlu membedakan transport. Penutup 1008 (pelanggaran kebijakan, biasanya kredensial salah) tidak memicu percobaan ulang; kesalahan lain menggunakan exponential backoff dengan batas 30 detik." },
          { kind: "added", text: "Layanan Firebase Cloud Messaging di server (app/services/fcm.py) dengan fallback tanpa operasi. Jika FCM_SERVICE_ACCOUNT_PATH tidak disetel atau file tidak ada, startup hanya mencatat peringatan dan semua pemanggilan send_fcm_notification menjadi no-op. Saat dikonfigurasi, server mengirim push via HTTP v1 API ke device token yang didaftarkan oleh Android." },
          { kind: "added", text: "Endpoint PUT /api/users/me/fcm-token pada server untuk mendaftarkan token FCM perangkat. Skema users.fcm_token (TEXT, nullable) ditambahkan ke tabel users. Klien mengirim string kosong saat keluar akun agar perangkat yang dikembalikan tidak terus menerima push untuk pengguna sebelumnya." },
          { kind: "added", text: "FCMService.kt pada Android sebagai FirebaseMessagingService. onNewToken mengirim token ke server saat token Firebase diperbarui; onMessageReceived mencatat payload. Build tetap berhasil dengan google-services.json placeholder (project_id fiktif) sehingga jalur FCM non-aktif sampai pengguna menambahkan konfigurasi Firebase yang asli." },
          { kind: "changed", text: "Halaman /monitoring bermigrasi dari EventSource (SSE) ke WebSocket. SSE endpoint lama tetap aktif untuk konsumen lain." },
          { kind: "removed", text: "Ketergantungan python-jose 3.3.0 ditandai usang dengan CVE-2024-33663 (algorithm confusion). Migrasi ke PyJWT direncanakan. Mitigasi saat ini: HS256 saja tanpa perpindahan kunci RS/ES." },
        ]},
      {
        version: "v0.23.0",
        date: "7 Oktober 2026",
        highlight: "Banner pelatihan gagal pada dasbor, alasan kegagalan lengkap",
        changes: [
          { kind: "added", text: "Banner Pemberitahuan Sistem pada /dashboard muncul saat model ML terakhir berstatus failed (pelatihan malam 23.00 WITA atau pemicu manual), menampilkan pesan error_message lengkap dengan tautan Lihat Detail ke /models dan tombol tutup." },
        ]},
      {
        version: "v0.22.0",
        date: "7 Oktober 2026",
        highlight: "Healthcheck Docker dan verifikasi API diperbaiki",
        changes: [
          { kind: "fixed", text: "Docker healthcheck untuk service web menggunakan wget bukan curl dan 127.0.0.1 bukan localhost untuk menghindari IPv6 dan command not found." },
          { kind: "fixed", text: "Halaman Laporan memperbaiki rantain AbortSignal sehingga kueri mount dan kueri debounce tidak saling menimpa hasil satu sama lain." },
        ]},
      {
        version: "v0.21.0",
        date: "6 Oktober 2026",
        highlight: "Kolom waktu dihapus dari ringkasan harian, data mobile bersih tanpa duplikat",
        changes: [
          { kind: "fixed", text: "Kolom waktu pada tabel ringkasan harian sekarang kosong (kosong) bukan 08.00 WITA; kolom log_date adalah tanggal saja tanpa komponen waktu." },
          { kind: "fixed", text: "Data muat ulang pada mount dan acara langsung SSE memakai waktu kosong untuk entri app_log karena kolom log_date hanya berisi tanggal." },
          { kind: "changed", text: "Sel tabel waktu menampilkan kosong jika waktu kosong, bukan kolom kosong." },
        ]},
      {
        version: "v0.20.0",
        date: "6 Oktober 2026",
        highlight: "Perbaikan tipe api.ts, batas Suspense, kebijakan tanpa penyimpanan setempat, versi otomatis, palet bagan",
        changes: [
          { kind: "fixed", text: "Halaman /students membungkus useSearchParams dalam batas Suspense agar pembangunan statis tidak gagal pada tata letak masa depan." },
          { kind: "changed", text: "Halaman /privacy menjelaskan bahwa kunci API dikelola server dengan kolam kunci berotasi, bukan disimpan di localStorage peramban." },
          { kind: "added", text: "Hook useVersion() mengambil versi dari /api/status dengan tembolok tingkat modul; halaman masuk, beranda, dan catatan pengembangan kini menampilkan versi yang konsisten." },
          { kind: "added", text: "Modul palette.ts menjadi sumber tunggal nilai oklch pada bagan Recharts agar tidak lagi melenceng dari token desain editoran." },
          { kind: "fixed", text: "Tipe getStudents() dan Student sekarang menggunakan antarmuka eksplisit StudentListResponse dengan pagination dan distribusi klaster." },
          { kind: "fixed", text: "Antarmuka Student diperluas dengan program_studi_id, program_studi_name, advisor_id, dan advisor_name." },
          { kind: "added", text: "Fungsi getAdvisors() dan tipe ScheduleRequest ditambahkan ke api.ts." },
          { kind: "changed", text: "Halaman /logs berganti nama menjadi Ringkasan Harian Mahasiswa; satu baris per mahasiswa per hari, sync menggantikan data, bukan menambah." },
          { kind: "changed", text: "Nama file unduhan pada halaman /logs berubah dari log-aktivitas menjadi ringkasan-harian." },
        ]},
      {
        version: "v0.17.0",
        date: "5 Oktober 2026",
        highlight: "Batas suspense, kebijakan tanpa penyimpanan setempat, versi otomatis, palet bagan",
        changes: [
          { kind: "fixed", text: "Halaman /students membungkus useSearchParams dalam batas Suspense agar pembangunan statis tidak gagal pada tata letak masa depan." },
          { kind: "changed", text: "Halaman /privacy menjelaskan bahwa kunci API dikelola server dengan kolam kunci berotasi, bukan disimpan di localStorage peramban." },
          { kind: "added", text: "Hook useVersion() mengambil versi dari /api/status dengan tembolok tingkat modul; halaman masuk, beranda, dan catatan pengembangan kini menampilkan versi yang konsisten." },
          { kind: "added", text: "Modul palette.ts menjadi sumber tunggal nilai oklch pada bagan Recharts agar tidak lagi melenceng dari token desain editoran." },
        ]},
      {
        version: "v0.16.0",
        date: "1 Oktober 2026",
        highlight: "Halaman log tidak lagi kosong, timestamp lokasi akurat",
        changes: [
          { kind: "added", text: "Halaman /logs memuat data riwayat aktivitas saat pertama dibuka dari endpoint /api/logs/history." },
          { kind: "fixed", text: "Timestamp log lokasi pada halaman /logs sekarang menampilkan waktu pencatatan sebenarnya, bukan waktu saat ini." },
          { kind: "fixed", text: "Fungsi getLogHistory dan LogStreamEvent ditambahkan ke api.ts." },
        ]},
      {
        version: "v0.15.0",
        date: "28 September 2026",
        highlight: "AI Analisis tanpa input API key: server-side 4 key pool",
        changes: [
          { kind: "removed", text: "Section Pengaturan Groq API di halaman /ai: input API key, durasi simpan, cara ambil API key, dan pemilih model." },
          { kind: "changed", text: "Header halaman /ai sekarang menampilkan label Model gpt-oss-120b di samping judul." },
          { kind: "changed", text: "chatWithAI di api.ts: signature disederhanakan, tidak menerima groqApiKey atau model." },
        ]},
      {
        version: "v0.14.0",
        date: "27 September 2026",
        highlight: "Bagian utama landing disederhanakan, CyclingFont dihapus",
        changes: [
          { kind: "changed", text: "Hero landing: CyclingWord sekarang hanya berganti antara Monitor dan Imato; tujuh kata bahasa daerah dihapus." },
          { kind: "removed", text: "Komponen CyclingFont dihapus; kata ung tidak lagi beranimasi." },
          { kind: "fixed", text: "chatWithAI di api.ts sekarang menggunakan apiFetch() agar mendapat alur retry 401." },
          { kind: "added", text: "Helper activateModel() di api.ts untuk endpoint PATCH /api/models/{id}/activate." },
          { kind: "fixed", text: "getProgramStudi() sekarang menerima argumen opsional { includeInactive, signal }." },
        ]},
      {
        version: "v0.13.0",
        date: "27 September 2026",
        highlight: "Header publik seragam ala landing, dasar hukum dihapus dari privasi, pendaftaran tidak lagi mengarahkan ke /login",
        changes: [
          { kind: "changed", text: "Header publik di /, /login, /register, /privacy, /changelog sekarang memakai LandingHeader bersama (logo + Tentang/Sistem/Cara Kerja/Kontributor + dropdown Akun & Bantuan + theme toggle + CTA Masuk Sistem). Pola SAIC transparan-ke-paper saat scroll." },
          { kind: "added", text: "Komponen PublicHeader dapat dipakai ulang dari app/(dashboard) tanpa duplikasi NavDropdown." },
          { kind: "removed", text: "Section Dasar hukum & rujukan regulasi di /privacy dihapus. Rujukan UU PDP No. 27 Tahun 2022 tetap di tautan dalam section 07 Hak Anda." },
          { kind: "changed", text: "/privacy section 07 Hak Anda kini menautkan langsung ke UU PDP No. 27 Tahun 2022 dan menyebut praktik GDPR secara eksplisit." },
          { kind: "added", text: "Ringkasan /privacy punya poin tambahan tentang kepatuhan GDPR dan UU PDP." },
          { kind: "fixed", text: "Bug /register: loadJurusan() tidak lagi memicu window.location.href=/login otomatis saat user belum login. fetch diganti ke raw fetch agar 401 tidak menendang user keluar." },
          { kind: "changed", text: "Top bar /login & /register mobile disederhanakan menjadi tombol Kembali saja; header global sekarang pakai LandingHeader." },
          { kind: "changed", text: "Footer catatan /login: ubah penjelasan akun agar konsisten (akun dibuat sendiri lewat /register, akun admin dibuat oleh admin lain)." },
        ]},
      {
        version: "v0.12.1",
        date: "27 September 2026",
        highlight: "Jurusan wajib untuk prodi baru, bagian tanpa induk dihapus",
        changes: [
          { kind: "added", text: "Dialog Tambah Prodi Baru di /register mewajibkan pilihan Jurusan, mencegah prodi orphan di database." },
          { kind: "removed", text: "Section Tanpa Jurusan di Pengaturan Akademik dihapus dari UI; orphan prodi tetap ada di database untuk kompatibilitas lama." },
          { kind: "added", text: "Header /privacy kini memuat logo UNG grayscale seperti /login dan /register." },
          { kind: "added", text: "Header /changelog kini memuat tautan Kebijakan Privasi di samping Beranda." },
        ]},
      {
        version: "v0.12.0",
        date: "27 September 2026",
        highlight: "Header auth bersih, ringkasan klaster editorial, header Changelog global, search lebih besar",
        changes: [
          { kind: "removed", text: "Panel kiri editorial di /login dan /register dihapus agar fokus pada formulir dan penjelasan singkat." },
          { kind: "added", text: "Header desktop di seluruh halaman publik dan dashboard memuat tautan Changelog." },
          { kind: "changed", text: "Bagian Ringkasan Klaster di /monitoring menggunakan font display-sans agar konsisten dengan metric card lain." },
          { kind: "changed", text: "Search bar di header dashboard lebih besar, lebih tinggi, dan memuat pintasan keyboard Cmd+K atau Ctrl+K." },
          { kind: "added", text: "Metric card trio rerata di /monitoring membaca dari titik akhir /api/reports/summary, cadangan ke komputasi lokal jika ringkasan kosong." },
          { kind: "added", text: "Section header komponen mendukung titleIcon untuk menandai bagian konfigurasi seperti Parameter ML." },
          { kind: "added", text: "Ikon gear pindah ke inline title pada bagian Parameter ML agar tidak lagi menempati slot kanan header." },
          { kind: "added", text: "Endpoint GET /api/program-studi dibuka untuk publik agar halaman /register dapat memuat dropdown sebelum login." },
        ]},
      {
        version: "v0.11.0",
        date: "27 September 2026",
        highlight: "Header halaman login + register, trio rerata, changelog berdiri sendiri",
        changes: [
          { kind: "added", text: "Top bar editorial di halaman /login dan /register agar konsisten dengan beranda dan kebijakan privasi." },
          { kind: "added", text: "Tiga metric card rerata harian pada /monitoring: Rerata Unlock Count, Rerata Sosmed, Rerata Game." },
          { kind: "added", text: "Row kedua metric card pada /reports berisi trio rerata yang sama, ditambah kartu catatan penjelasan." },
          { kind: "added", text: "Metric card Rerata Unlock Count pada /dashboard sebagai ringkasan cepat." },
          { kind: "added", text: "Halaman publik /changelog sebagai dokumentasi mandiri, dipisahkan dari landing." },
          { kind: "changed", text: "Kolom unduhan CSV/Excel/PDF pada /monitoring dan /reports sekarang menyertakan tiga rerata baru." },
        ]},
      {
        version: "v0.10.0",
        date: "27 September 2026",
        highlight: "Tab Akademik di pengaturan, sinkronisasi profil, em-dash dihapus",
        changes: [
          { kind: "added", text: "Pengaturan tab 04 Kursus & Jadwal: CRUD mata kuliah, jadwal, dan antrian permintaan akademik." },
          { kind: "added", text: "Tabel detail terpisah dari grafik pada Laporan dengan periode 14/4/3 hari/minggu/bulan." },
          { kind: "changed", text: "Animasi kata Monitor pada hero sekarang sinkron dengan rotasi font UNG, tempo 2 detik." },
          { kind: "fixed", text: "Layout header pada mobile dirapikan agar tidak bertabrakan dengan judul halaman." },
          { kind: "fixed", text: "Bug 3 detik redirect ke /login saat membuka halaman pendaftaran karena endpoint prodi belum publik." },
          { kind: "fixed", text: "Penulisan MHS diseragamkan menjadi Mahasiswa di seluruh dashboard." },
          { kind: "removed", text: "Tanda em-dash diganti koma atau kata kosong di 19 file tampilan publik dan dashboard." },
        ]},
      {
        version: "v0.9.5",
        date: "26 September 2026",
        highlight: "Pemolesan antarmuka, bayangan hangat, daftar perangkat login",
        changes: [
          { kind: "added", text: "Utilitas CSS lift-1, lift-2, lift-3 untuk kedalaman kartu yang lebih lembut." },
          { kind: "added", text: "Daftar perangkat login dengan tombol Cabut di Profil Saya." },
          { kind: "added", text: "Dropdown Program Studi menggantikan input teks Jurusan di pengaturan dan pendaftaran." },
          { kind: "fixed", text: "Bug download panel auto-close karena backdrop menelan klik." },
        ]},
    ]},
  {
    channel: "android",
    title: "Aplikasi Android · Mahasiswa",
    blurb:
      "Aplikasi Kotlin untuk mahasiswa dengan foreground service, Room " +
      "terenkripsi SQLCipher, dan pengiriman log ke broker MQTT.",
    versions: [
      {
        "version": "v0.29.0",
        "date": "13 November 2026",
        "highlight": "Monitoring beberapa kelas dan antrean sinkronisasi",
        "changes": [
          {
            "kind": "fixed",
            "text": "Penggunaan kuliah dihitung per jadwal, termasuk dua kelas pada hari yang sama, tanpa memasukkan waktu jeda antar kelas."
          },
          {
            "kind": "fixed",
            "text": "Pengakuan sinkronisasi tidak menghapus perubahan yang belum dikirim. Data pending tetap tersimpan ketika keluar akun."
          },
          {
            "kind": "fixed",
            "text": "Sinkronisasi otomatis mengikuti jadwal malam WITA dan menjaga antrean ketika jaringan belum tersedia."
          },
          {
            "kind": "fixed",
            "text": "Gangguan refresh sementara mempertahankan sesi. Telemetri MQTT memakai tanda tangan sesi."
          },
          {
            "kind": "fixed",
            "text": "Kontrol biometrik dan switch memiliki label serta target sentuh yang lebih jelas."
          }
        ]
      },
      {
        version: "v0.28.0",
        date: "12 Oktober 2026",
        highlight: "Indikator visual hari ini vs 30 hari, audit performa pengumpulan data",
        changes: [
          { kind: "added", text: "Indikator visual HARI INI (biru primer) pada kartu ringkasan harian dan 30 HARI (teal sukses) pada kartu ringkasan 30 hari, sehingga pengguna tidak keliru memahami jendela waktu tiap metrik." },
          { kind: "added", text: "Sublabel Rerata harian / Daily average di bawah judul 30 hari untuk memperjelas bahwa keempat metrik pada kartu tersebut adalah rerata per hari, bukan total." },
          { kind: "changed", text: "Judul kartu Jadwal Hari Ini dengan eyebrow Jadwal Hari Ini untuk konsistensi dengan penanda jendela waktu pada kartu lainnya." },
        ]},
      {
        version: "v0.27.0",
        date: "10 Oktober 2026",
        highlight: "Layanan Firebase Cloud Messaging dengan fallback, websocket diagnostik",
        changes: [
          { kind: "added", text: "Kelas FCMService pada paket data.push memperluas FirebaseMessagingService. onNewToken mengirim token ke server melalui PUT /api/users/me/fcm-token saat token Firebase diperbarui; onMessageReceived mencatat payload. FcmTokenRequest DTO dan registerFcmToken() pada MonitorUNGApi ditambahkan." },
          { kind: "added", text: "Berkas app/google-services.json placeholder dengan struktur valid (package_name com.monitorung.app dan com.monitorung.app.dev) sehingga build Android berhasil tanpa proyek Firebase sungguhan. Untuk aktivasi: ganti dengan google-services.json dari Firebase Console dan tambahkan FCM_SERVICE_ACCOUNT_PATH di .env.production server." },
          { kind: "added", text: "Plugin Google Services (libs.plugins.google.services) dan firebase-messaging-ktx ditambahkan ke build.gradle.kts serta libs.versions.toml. Layanan FCM dideklarasikan di AndroidManifest dengan intent-filter untuk com.google.firebase.MESSAGING_EVENT." },
        ]},
      {
        version: "v0.26.0",
        date: "10 Oktober 2026",
        highlight: "Audit batch: 3 isu kritis dan 2 isu penting diperbaiki",
        changes: [
          { kind: "fixed", text: "MainActivity memperluas ComponentActivity padahal BiometricGateScreen melakukan cast ke FragmentActivity; cast selalu null dan gerbang biometrik selalu jatuh ke onSuccess(). Sekarang MainActivity memperluas FragmentActivity, kelas dasar minimal yang memenuhi cast dan tetap kompatibel dengan Hilt." },
          { kind: "fixed", text: "BatteryBasedSotManager.persistDayData() memanggil appUsageLogDao.insert() dengan nilai nol untuk sosmed, game, dan unlock pada pergantian tengah malam; REPLACE menimpa total hari yang berjalan dengan nol. Sekarang persistDayData memanggil accumulateDay() agar total bertambah alih-alih ditimpa." },
          { kind: "fixed", text: "SmartMonitoringManager adalah @Singleton Hilt; destroy() dan logout() memanggil scope.cancel() yang mematikan lingkup secara permanen, sehingga login kedua menggunakan singleton dengan lingkup mati. Sekarang scope menjadi nullable @Volatile, ensureScope() membuat ulang jika perlu, dan destroy/logout memakai cancelChildren()." },
          { kind: "fixed", text: "ScheduleDto.subjectName dan ScheduleDto.lecturerName tidak memiliki anotasi @SerializedName; Gson mencari kunci camelCase sementara server mengirim snake_case. Sekarang kedua kolom memiliki @SerializedName dengan nama ular." },
          { kind: "fixed", text: "HomeViewModel menggunakan Calendar.DAY_OF_WEEK dengan konvensi Sun=1, sedangkan seluruh aplikasi menyimpan ISO Mon=1; Senin cocok dengan jadwal Selasa. Sekarang konversi Java ke ISO diterapkan sebelum query." },
        ]},
      {
        version: "v0.22.0",
        date: "7 Oktober 2026",
        highlight: "Bottom sheet ajukan jadwal akademik mengirim data ke server, data mati dibersihkan",
        changes: [
          { kind: "fixed", text: "Bottom sheet Ajukan Jadwal di layar Jadwal tidak memuat daftar dropdown karena loadDirectory() tidak pernah dipanggil sebelum sheet dibuka. Ditambahkan LaunchedEffect dengan penghitung trigger yang memastikan data selesai dimuat sebelum sheet ditampilkan." },
          { kind: "fixed", text: "Waktu default di formulir Ajukan Jadwal menggunakan nilai statis 08:00 dan 10:00. Sekarang dihitung secara dinamis: waktu mulai dibulatkan ke 30 menit berikutnya, waktu selesai = mulai + 2 jam." },
          { kind: "removed", text: "Enam endpoint API mati dihapus dari MonitorUNGApi: createSchedule, updateSchedule, getHistory, getFakult, getJurusan, getProgramStudi." },
          { kind: "fixed", text: "Bottom sheet Ajukan Jadwal tidak bisa kirim ke server karena field name di ScheduleRequestCreateDto dikirim sebagai camelCase (dayOfWeek, startTime) tetapi server expect snake_case (day_of_week, start_time). Semua field DTO ditambah @SerializedName agar nama field JSON cocok dengan API backend." },
          { kind: "removed", text: "Sepuluh metode dan import mati dihapus dari UsageRepositoryImpl, HomeViewModel, AuthRepositoryImpl, dan domain/Repositories: collectLocation, calculateDistance, awaitResult, fusedLocationClient, onPasswordChange, toggleTestMode, saveGuestUser, dan antarmuka terkait." },
        ]},
      {
        version: "v0.20.0",
        date: "6 Oktober 2026",
        highlight: "ID harian per mahasiswa, sinkronisasi menggantikan data, lapisan ganda masuk otomatis, akses luring",
        changes: [
          { kind: "added", text: "Room database version 3 → 4 dengan UNIQUE INDEX pada (student_id, log_date) untuk app_usage_logs. Setiap mahasiswa memiliki tepat satu baris per hari di database lokal." },
          { kind: "added", text: "AppUsageLogDao.accumulateDay(delta): transaksi atomik yang menambahkan delta kumulatif ke baris hari yang ada; kolektor 45-menit sekarang menumpuk total hari, bukan menambah baris baru." },
          { kind: "added", text: "Kolektor UsageRepositoryImpl.collectAppUsage() membaca baris hari yang ada, menambahkan delta dari UsageSnapshotStore, dan menulis ulang totals hari yang diperbarui." },
          { kind: "changed", text: "Lapisan sinkronisasi mengirim satu baris per hari (ringkasan harian), nilai total hari lengkap, bukan delta per interval. Server UPSERT pada (student_id, log_date) menggantikan nilai hari, bukan menambah baris kedua." },
          { kind: "added", text: "AppUsageLogEntity menggunakan @Index(value = [\"student_id\", \"log_date\"], unique = true) + indeks non-unik pada student_id untuk kueri yang sering dipakai." },
          { kind: "added", text: "MIGRATION_3_4: rename tabel lama → tabel baru, INSERT agregat per (student, date) menggunakan SUM/MAX, lalu DROP tabel lama. Mempertahankan total yang ditampilkan Beranda." },
          { kind: "fixed", text: "Beranda sebelumnya menampilkan 6j 39m (benar) tetapi data yang dikirim ke server hanya delta per interval, server menyimpan angka-angka kecil terpisah. Sekarang server dan Android memiliki total hari yang cocok." },
          { kind: "fixed", text: "Riwayat Android yang menunjukkan 5 entri untuk hari yang sama (1 Pending + 4 Synced) sekarang menampilkan tepat satu entri per hari; sync yang tidak sengaja menggantikan data hari, bukan menambah entri baru." },
          { kind: "fixed", text: "Setiap kali mengirim data adalah data rangkaian 1 hari, bukan data baru, screen time, game time, sosmed time, dan unlock count bertambah dengan benar lintas koleksi." },
          { kind: "fixed", text: "Login MainActivity lapisan ganda, AnimatedContent sekarang menjadi satu-satunya pengatur render state, splash tidak lagi merender dua lapis dengan formulir login." },
          { kind: "fixed", text: "Pesan galat '530' (atau pesan HTTP mentah) dari Retrofit sekarang ditampilkan sebagai 'Server belum aktif' bagi pengguna; kesalahan jaringan dideteksi dan dipetakan ke pesan bahasa Indonesia." },
          { kind: "added", text: "Akses luring: percobaan masuk otomatis kini melewati kesalahan jaringan (DNS / connection / timeout) dan membawa pengguna ke aplikasi dengan data Room yang sudah ada, bukan harus masuk ulang saat server tidak aktif." },
          { kind: "added", text: "Banner luring kuning tua di HomeScreen ketika API tidak dapat dijangkau; deteksi melalui ping ke /api/status (3 detik batas waktu)." },
          { kind: "changed", text: "LoginScreen tidak lagi menggunakan latar belakang gradien hardcode, kini memakai warna tema Material sebagai permukaan yang konsisten." },
        ]},
      {
        version: "v0.19.0",
        date: "6 Oktober 2026",
        highlight: "PaperCard style, foto profil di pengaturan, hapus mode tamu",
        changes: [
          { kind: "changed", text: "Semua sebutan gaya antarmuka di komponen, komentar, dan dokumentasi Android memakai nama baru 'PaperCard' (pola visual) menggantikan sebutan pustaka PaperCard yang dipakai sementara." },
          { kind: "changed", text: "Kartu info pengguna di SettingsScreen ganti dari GradientCard menjadi PaperCard; sesuai pola kartu di layar lain." },
          { kind: "added", text: "Foto profil di SettingsScreen sekarang menampilkan gambar avatar yang dimuat dari avatar_url (base64 data URL); tampilan awal huruf dipakai saat belum ada foto." },
          { kind: "added", text: "Teks ikon izin di PermissionStatusItem ('Granted' / 'Tap to grant') sekarang menggunakan stringResource dari values/values-id." },
          { kind: "removed", text: "Mode tamu dihapus sepenuhnya: kode toggleTestMode, loginAsGuest, banner tamu, dan tombol tamu dihapus dari LoginScreen dan LoginViewModel." },
          { kind: "removed", text: "String terkait mode tamu dihapus dari values/strings.xml dan values-id/strings.xml: auth_guest_mode, auth_guest_hint, login_guest_banner, login_guest_close." },
          { kind: "added", text: "File memory papercard-ui-reference.md diubah namanya menjadi papercard-ui-reference.md." },
        ]},
      {
        version: "v0.17.0",
        date: "5 Oktober 2026",
        highlight: "BootReceiver aman setelah kelas berakhir, pemutusan notifikasi saat keluar, autentikasi MQTT",
        changes: [
          { kind: "fixed", text: "BootReceiver menolak memulai layanan apabila end_ts sudah lewat; reboot setelah kelas berakhir sebelumnya memicu ForegroundServiceDidNotStartInTimeException." },
          { kind: "changed", text: "LoginViewModel.logout() kini memanggil notificationScheduler.cancelAll() agar notifikasi pagi serta pengingat sinkronisasi tidak lagi menyala pada perangkat yang keluar." },
          { kind: "fixed", text: "AuthRepositoryImpl.close() memakai cancelChildren() dan mengatur ulang bendera inisialisasi; keluar lalu masuk ulang sebelumnya melihat data kosong sampai aplikasi dimatikan paksa." },
          { kind: "added", text: "Autentikasi kata sandi pada klien MQTT Android memakai BuildConfig.MQTT_USERNAME dan BuildConfig.MQTT_PASSWORD; varian dev tetap tanpa autentikasi untuk kompatibilitas lokal." },
        ]},
      {
        version: "v0.14.0",
        date: "27 September 2026",
        highlight: "Perbaikan kompilasi: pembungkusan Radius, label kembali diperbaiki",
        changes: [
          { kind: "fixed", text: "Nilai Radius* di Theme.kt dibungkus RoundedCornerShape(Radius*) di seluruh file agar sesuai dengan fungsi clip() dan shape." },
          { kind: "fixed", text: "SmartMonitoringManager.kt: return di dalam scope.launch diperbaiki menjadi return@launch." },
          { kind: "fixed", text: "TelegramStyleNavBar.kt: scheme.primary diganti MaterialTheme.colorScheme.primary." },
          { kind: "fixed", text: "SettingsScreen.kt: stringResource() dipindahkan keluar dari lambda scope.launch." },
          { kind: "fixed", text: "SkeletonShimmer.kt: parameter shape default sekarang RoundedCornerShape(RadiusXS)." },
          { kind: "fixed", text: "PaperCard.kt: val shape = RoundedCornerShape(RadiusXL)." },
          { kind: "fixed", text: "TermsScreen.kt: border .background(Color, RadiusXL) diperbaiki." },
        ]},
      {
        version: "v0.18.0",
        date: "5 Oktober 2026",
        highlight: "Perombakan antarmuka bergaya PaperCard: permainan, gradien, animasi pegas, komponen baru",
        changes: [
          { kind: "added", text: "Tujuh komponen baru: GradientCard (kartu dengan gradien fill), GradientSpringButton (tombol gradien bouncy), PlayfulProgressBar (progress bar gradien rounded), DailyChallengeWidget (tantangan harian), AchievementBadge (lencana prestasi), BouncySwitch (saklar spring), BubbleNavBar (navigasi gelembung menggantikan pill-in-pill)." },
          { kind: "added", text: "Gradient preset palette (GradientBlueTeal, GradientAmberGold, GradientPurplePink, GradientTealGreen, GradientSoftBlue, GradientFuchsiaPurple) untuk fills gradien di kartu dan tombol." },
          { kind: "added", text: "HomeScreen dibangun ulang: LevelProgressCard (XP/level progress), DailyChallengeWidget, gradient badges pada PlayfulMetricCard, QuickActions dalam GradientCard, ConfettiBurst pada login sukses." },
          { kind: "added", text: "ScheduleScreen: GradientCard untuk jadwal aktif, GradientSpringButton FAB, gradient status badge pada request cards, gradient time badges, gradient day selector." },
          { kind: "added", text: "HistoryScreen: GradientCard summary, CompactAchievementBadge, gradient time badges, weekly bilah progres." },
          { kind: "added", text: "ProfileScreen: GradientCard avatar glow, achievement badges row, gradient section backgrounds." },
          { kind: "added", text: "SettingsScreen: BouncySwitch untuk biometric, GradientSpringButton logout (FuchsiaPurple), colorful section gradients." },
          { kind: "added", text: "TermsScreen: GradientCard content, gradient progress bar, colorful left-border accents." },
          { kind: "added", text: "PermissionScreen: GradientBadgeIcon, gradient progress bar, confetti on completion." },
          { kind: "added", text: "BiometricGateScreen: GradientCard pembungkus, floating lock animation, GradientSpringButton verify." },
          { kind: "added", text: "LoginScreen: gradient background (PrimaryBlue 6% opacity), floating logo animation (-6dp ke +6dp), GradientSpringButton, ConfettiBurst on login success." },
          { kind: "added", text: "PaperCard bayangan diperbarui: cahaya sekitar halus dengan SoftShadowColorLight menggantikan ketinggian kode tetap." },
          { kind: "changed", text: "ConfettiBurst palette diperluas dari 4 menjadi 6 warna (ChartBlue, ChartTeal, ChartAmber, ChartPurple, ErrorFuchsia, WarningAmber)." },
          { kind: "fixed", text: "SpringButton disabled state sekarang menggunakan Color.Gray.copy(alpha=0.4f) alih-alih gradient.copy(alpha=0.4f) yang tidak valid karena Brush tidak punya metode copy." },
          { kind: "fixed", text: "Semua rujukan PrimaryTeal diganti ChartTeal sesuai nama token yang benar." },
          { kind: "fixed", text: "Semua rujukan PrimaryFuchsia diganti ErrorFuchsia sesuai nama token yang benar." },
        ]},
      {
        version: "v0.12.0",
        date: "27 September 2026",
        highlight: "Perombakan antarmuka total mengikuti gaya PaperCard",
        changes: [
          { kind: "added", text: "Tujuh komponen PaperCard-pattern (skeleton shimmer, getaran, animated counter, pull-to-refresh, streak, confetti, progress ring) dipakai ulang di semua layar." },
          { kind: "changed", text: "Layar Login, Home, History, Schedule, Profile, Settings, Onboarding, dan Splash dibangun ulang dengan Material 3 + PaperCard patterns." },
          { kind: "added", text: "Token redaction yang aman, biometric gate, dan service resilience tetap dijaga." },
        ]},
      {
        version: "v0.11.0",
        date: "27 September 2026",
        highlight: "Pengumpulan data trio rerata sudah berlangsung sejak versi awal",
        changes: [
          { kind: "changed", text: "Tidak ada perubahan izin pada rilis ini; UsageStats sudah mencakup social_media_time_minutes, game_time_minutes, dan unlock_count." },
          { kind: "added", text: "Dokumentasi publik di halaman /changelog memperjelas peran Android sebagai sumber data trio rerata." },
        ]},
      {
        version: "v0.10.0",
        date: "27 September 2026",
        highlight: "Kaskade Fakultas ke Jurusan ke Program Studi",
        changes: [
          { kind: "added", text: "Pemilih kaskade tiga tingkat di pendaftaran dan profil dosen sesuai dengan backend." },
          { kind: "added", text: "Login mengirim device_id dan device_name untuk pencocokan dengan tabel login_devices di server." },
        ]},
      {
        version: "v0.9.0",
        date: "25 September 2026",
        highlight: "Stabilitas layanan dan SQLCipher",
        changes: [
          { kind: "fixed", text: "Foreground service dimulai ulang setelah onTaskRemoved menggunakan SharedPreferences." },
          { kind: "fixed", text: "Frasa sandi SQLCipher 32 byte acak disimpan di EncryptedSharedPreferences." },
          { kind: "added", text: "Certificate pinning untuk build prod monitorterop.my.id." },
        ]},
    ]},
];

export const KIND_LABEL: Record<ChangeKind, string> = {
  added: "Baru",
  fixed: "Perbaikan",
  changed: "Perubahan",
  removed: "Dihapus"};

export const KIND_DOT: Record<ChangeKind, string> = {
  added: "bg-success",
  fixed: "bg-primary",
  changed: "bg-warning",
  removed: "bg-destructive"};
