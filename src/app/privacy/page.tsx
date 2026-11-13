import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Eye,
  Trash2,
  Server,
  Bell,
  Cookie,
  Users,
  Database,
  KeyRound,
  Smartphone,
  Globe,
  Mail,
  Clock,
  FileText,
  CircleCheck,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";

export const metadata: Metadata = {
  title: "Kebijakan Privasi · Monitor UNG",
  description:
    "Bagaimana Monitor UNG mengumpulkan, menyimpan, melindungi, dan menghapus data mahasiswa Universitas Negeri Gorontalo.",
};

// ─── Editorial Privacy Page ─────────────────────────────────────────────
// Editorial type-forward treatment matching the rest of the dashboard:
//   - Eyebrow caps + display-serif titles
//   - Hairline rules, paper bg, no rounded chrome
//   - Numbered sections (01 Data, 02 Penyimpanan, dst.)
//   - Inverted CTA + status badge for last-updated timestamp

const LAST_UPDATED = "18 Oktober 2026";
const POLICY_VERSION = "v1.6.0";
const APP_VERSION = "v0.28.0";
const CONTACT_EMAIL = "monitor@ung.ac.id";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-5 sm:px-8 pt-20 pb-12 sm:pt-20 sm:pb-16">
        {/* Eyebrow + title block */}
        <div className="mb-10 sm:mb-14 animate-fade-up">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
            <span className="eyebrow-sm text-ink">01 / Dokumen</span>
            <span className="eyebrow-sm">Universitas Negeri Gorontalo</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Berlaku
            </span>
          </div>

          <h1 className="display-sans text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05] uppercase sm:normal-case sm:leading-[1.1]">
            Kebijakan Privasi
            <span className="block display-italic text-ink mt-1 normal-case">
              &amp; Penanganan Data Mahasiswa
            </span>
          </h1>

          <p className="text-sm sm:text-base text-ink/60 mt-4 max-w-prose leading-relaxed">
            Dokumen ini menjelaskan bagaimana Monitor UNG, aplikasi mobile
            Android untuk mahasiswa dan dasbor web untuk admin/dosen,
            mengumpulkan, menyimpan, melindungi, dan apabila diperlukan,
            menghapus data Anda. Kami percaya privasi adalah prasyarat, bukan
            fitur tambahan.
          </p>

          {/* Meta stripversion + last-updated */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mt-7 pt-5 border-t border-hairline">
            <MetaItem label="Versi kebijakan" value={POLICY_VERSION} />
            <MetaItem label="Berlaku sejak" value="1 Agustus 2026" />
            <MetaItem label="Pembaruan" value={LAST_UPDATED} />
            <MetaItem label="Versi aplikasi" value={APP_VERSION} />
          </dl>
        </div>

        {/* ── Ringkasan singkat (TL;DR) ────────────────────────────── */}
        <section className="editorial-panel animate-fade-up px-6 sm:px-8 py-7 sm:py-9 mb-12 sm:mb-16">
          <p className="eyebrow-sm text-ink mb-3">00 / Ringkasan</p>
          <h2 className="display-sans text-xl sm:text-2xl text-ink mb-4 leading-tight">
            Dalam satu menit.
          </h2>
          <ul className="space-y-2.5 text-sm text-ink/80 leading-relaxed">
            <TLDRItem>
              Kami hanya mengumpulkan data yang diperlukan untuk menghitung
              skor distraksi akademik. Tidak ada pelacakan iklan, tidak ada
              pihak ketiga, tidak ada penjualan data.
            </TLDRItem>
            <TLDRItem>
              Data disimpan dengan enkripsi AES-256 di perangkat (SQLCipher)
              dan TLS + bcrypt di server. Token autentikasi tidak pernah
              meninggalkan HttpOnly cookie.
            </TLDRItem>
            <TLDRItem>
              Anda dapat menghapus seluruh data kapan pun dari aplikasi
              Android, atau dengan mengirim permintaan ke {CONTACT_EMAIL}.
              Permintaan diproses paling lambat 14 hari kerja.
            </TLDRItem>
            <TLDRItem>
              Hanya role <strong>admin</strong> dan <strong>dosen</strong> yang
              dapat melihat dasbor agregat. Mahasiswa tidak pernah melihat data
              individu mahasiswa lain.
            </TLDRItem>
            <TLDRItem>
              Kami mengikuti praktik GDPR dan{" "}
              <a
                href="https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-4 hover:text-ink"
              >
                UU PDP No. 27 Tahun 2022
              </a>{" "}
              sebagai acuan perlindungan data.
            </TLDRItem>
          </ul>
        </section>

        {/* ── Section 01: Data yang dikumpulkan ────────────────────── */}
        <Section number="01" icon={Database} title="Data yang kami kumpulkan">
          <p className="text-ink/80 mb-4">
            Aplikasi mengumpulkan tiga kategori data. Setiap kategori memiliki
            dasar hukum dan tujuan yang berbeda.
          </p>

          <Subsection label="A. Data identitas akun">
            <ul className="space-y-1.5">
              <BulletRow>
                NIM, nama lengkap, email, program studi, fakultas, semester,
                dan peran (mahasiswa / dosen).
              </BulletRow>
              <BulletRow>
                Disediakan langsung oleh Anda saat registrasi atau login
                pertama. Wajib untuk membuat akun.
              </BulletRow>
              <BulletRow>
                Disimpan di server PostgreSQL terenkripsi saat disimpan (TLS
                dalam transit, bcrypt untuk kata sandi).
              </BulletRow>
            </ul>
          </Subsection>

          <Subsection label="B. Data penggunaan aplikasi (hanya mobile)">
            <ul className="space-y-1.5">
              <BulletRow>
                Statistik penggunaan per aplikasi: total screen-on time,
                screen-on time untuk kategori media sosial, gim, dan
                produktivitas, jumlah buka kunci, serta indikator apakah
                perangkat digunakan saat jam kelas.
              </BulletRow>
              <BulletRow>
                Dikumpulkan otomatis oleh layanan latar depan di Android
                setelah Anda mengaktifkan perizinan{" "}
                <strong>Usage Access</strong>. Anda dapat mencabutnya kapan
                pun di Pengaturan Android.
              </BulletRow>
              <BulletRow>
                Diunggah ke server melalui HTTPS, dengan idempotency key untuk
                mencegah duplikat saat koneksi terputus-putus.
              </BulletRow>
            </ul>
          </Subsection>

          <Subsection label="C. Data lokasi (hanya mobile, opt-in)">
            <ul className="space-y-1.5">
              <BulletRow>
                Koordinat GPS dan timestamp, hanya saat aplikasi mendeteksi
                Anda berada di area kampus (geofence). Tidak pernah dilacak
                di luar area kampus.
              </BulletRow>
              <BulletRow>
                Digunakan untuk verifikasi kehadiran di kelas. Anda dapat
                menolak perizinan ini; aplikasi tetap berjalan normal tanpa
                fitur verifikasi.
              </BulletRow>
              <BulletRow>
                Disimpan maksimal 90 hari, kemudian dianonimkan menjadi
                agregat per fakultas untuk riset.
              </BulletRow>
            </ul>
          </Subsection>

          <Subsection label="Yang TIDAK kami kumpulkan">
            <ul className="space-y-1.5">
              <BulletRow> Konten pesan, panggilan, atau email Anda. </BulletRow>
              <BulletRow>
                {" "}
                Kontak, foto, atau berkas pribadi di perangkat Anda.{" "}
              </BulletRow>
              <BulletRow>
                {" "}
                Identifier iklan (Google Advertising ID, IDFA, dsb.).{" "}
              </BulletRow>
              <BulletRow>
                {" "}
                Data dari aplikasi lain selain yang masuk dalam tiga kategori
                statistik di atas.{" "}
              </BulletRow>
            </ul>
          </Subsection>
        </Section>

        {/* ── Section 02: Penyimpanan & Perlindungan ──────────────── */}
        <Section
          number="02"
          icon={Lock}
          title="Bagaimana data disimpan & dilindungi"
        >
          <p className="text-ink/80 mb-5">
            Kami menerapkan pertahanan berlapis, dari perangkat hingga
            server, sehingga kebocoran satu lapisan tidak mengekspos seluruh
            data.
          </p>

          <Subsection label="Di perangkat (Android)">
            <ul className="space-y-1.5">
              <BulletRow>
                <strong>SQLCipher (AES-256)</strong> basis data lokal
                dienkripsi dengan frasa sandi 32-byte acak yang disimpan di
                EncryptedSharedPreferences (AES-256-GCM + Android Keystore).
              </BulletRow>
              <BulletRow>
                <strong>Biometric gate</strong> aplikasi tidak dapat dibuka
                tanpa autentikasi biometrik setelah auto-login. Token akses
                tidak pernah diekspos ke proses lain.
              </BulletRow>
              <BulletRow>
                <strong>Certificate pinning</strong> rilis produksi hanya
                menerima sertifikat Cloudflare untuk domain{" "}
                <code className="font-mono text-[12px] bg-ink/[0.04] px-1 py-0.5">
                  monitorterop.my.id
                </code>
                . Serangan MITM dengan sertifikat self-signed akan ditolak.
              </BulletRow>
              <BulletRow>
                <strong>Foreground service persistence</strong> layanan
                monitoring ditulis ulang otomatis saat perangkat boot, tetapi
                hanya berjalan ketika izin Usage Access masih aktif.
              </BulletRow>
            </ul>
          </Subsection>

          <Subsection label="Di server (FastAPI + PostgreSQL)">
            <ul className="space-y-1.5">
              <BulletRow>
                <strong>Hanya HTTPS</strong> seluruh komunikasi ke{" "}
                <code className="font-mono text-[12px] bg-ink/[0.04] px-1 py-0.5">
                  monitorterop.my.id
                </code>{" "}
                melalui Cloudflare Tunnel dengan TLS 1.3.
              </BulletRow>
              <BulletRow>
                <strong>Cookie HttpOnly + SameSite</strong> token akses dan
                refresh disimpan di HttpOnly cookie. JavaScript di dasbor
                tidak pernah memiliki akses langsung ke token.
              </BulletRow>
              <BulletRow>
                <strong>Pengacakan kata sandi bcrypt</strong> 12 putaran
                (~80 ms per verifikasi), garam otomatis per pengguna. Login
                dengan email valid maupun email tidak-valid memakan waktu
                yang sama untuk mencegah serangan pewaktuan enumerasi
                pengguna.
              </BulletRow>
              <BulletRow>
                <strong>JWT dengan masa pakai pendek</strong> token akses
                berlaku 30 menit, token penyegar 7 hari. Logout menghapus
                semua token penyegar di basis data.
              </BulletRow>
              <BulletRow>
                <strong>AwareDateTime timestamps</strong> semua kolom waktu
                di database bertipe <code className="font-mono text-[12px] bg-ink/[0.04] px-1 py-0.5">TIMESTAMP WITH TIME ZONE</code>{" "}
                (UTC), sehingga tidak ada ambiguitas zona waktu yang bisa
                dieksploitasi untuk korelasi data.
              </BulletRow>
            </ul>
          </Subsection>

          <Subsection label="Operasional">
            <ul className="space-y-1.5">
              <BulletRow>
                <strong>Rate limiting</strong> endpoint login dibatasi 5
                percobaan per menit per IP; refresh token 3 per menit.
              </BulletRow>
              <BulletRow>
                <strong>Audit log</strong> setiap akses admin/dosen ke data
                mahasiswa individu dicatat dengan timestamp, user_id, dan
                aksi. Log dapat diminta oleh Anda.
              </BulletRow>
              <BulletRow>
                <strong>Cadangan terenkripsi</strong> snapshot PostgreSQL
                harian disimpan di volume terenkripsi (LUKS), dengan waktu
                simpan 30 hari. Cadangan tidak pernah meninggalkan hos.
              </BulletRow>
            </ul>
          </Subsection>
        </Section>

        {/* ── Section 03: Tujuan penggunaan ────────────────────────── */}
        <Section
          number="03"
          icon={Eye}
          title="Untuk apa data Anda digunakan"
        >
          <p className="text-ink/80 mb-4">
            Data hanya diproses untuk tiga tujuan berikut. Tidak ada
            profiling iklan, tidak ada penjualan, tidak ada pihak ketiga.
          </p>

          <ol className="space-y-4 list-none">
            <NumberedItem n="1" title="Penelitian akademik internal">
              Menghitung <em>distraction score</em> menggunakan pipeline PCA +
              K-Means. Hasilnya adalah klaster (Rendah / Sedang / Tinggi)
              yang ditampilkan ke Anda, beserta rekomendasi pola belajar.
            </NumberedItem>
            <NumberedItem n="2" title="Dasbor agregat untuk staf">
              Distribusi klaster ditampilkan ke admin dan dosen sebagai
              agregat (mis. &quot;42% mahasiswa di klaster Sedang minggu ini&quot;).
              Data individu hanya dapat diakses oleh admin prodi untuk
              kebutuhan bimbingan, dengan jejak audit.
            </NumberedItem>
            <NumberedItem n="3" title="Notifikasi & rekomendasi personal">
              Memberikan saran personal kepada mahasiswa tentang waktu belajar
              yang lebih fokus. Tidak ada notifikasi push promosi atau dari
              pihak ketiga; semua pesan dihasilkan secara lokal atau
              melalui model bahasa Groq dengan konteks agregat saja.
            </NumberedItem>
          </ol>

          <Callout tone="info">
            <strong>AI assistant:</strong> Fitur chat AI di dasbor menggunakan
            model bahasa Groq (llama-3.3-70b-versatile). Konteks yang dikirim
            ke Groq adalah <em>agregat klaster</em> (bukan data per-mahasiswa)
            dan hanya atas permintaan eksplisit Anda. API key dikelola
            sepenuhnya di sisi server (key pool dengan rotasi otomatis) dan
            tidak pernah diminta atau disimpan di peramban Anda.
          </Callout>
        </Section>

        {/* ── Section 04: Siapa yang bisa akses ────────────────────── */}
        <Section
          number="04"
          icon={Users}
          title="Siapa yang dapat melihat data Anda"
        >
          <p className="text-ink/80 mb-5">
            Sistem menggunakan <strong>Role-Based Access Control</strong>{" "}
            (RBAC) dengan tiga peran: <code className="font-mono text-[12px] bg-ink/[0.04] px-1 py-0.5">admin</code>,{" "}
            <code className="font-mono text-[12px] bg-ink/[0.04] px-1 py-0.5">dosen</code>,{" "}
            dan{" "}
            <code className="font-mono text-[12px] bg-ink/[0.04] px-1 py-0.5">mahasiswa</code>
            . Pembuatan akun admin tidak pernah diizinkan lewat registrasi
            publik.
          </p>

          <div className="border border-hairline divide-y divide-hairline">
            <RBACRow
              role="admin"
              scope="Akses penuh ke agregat dasbor, manajemen pengguna, dan konfigurasi model ML. Audit log mencatat semua akses data individu."
            />
            <RBACRow
              role="dosen"
              scope="Akses ke agregat klaster dan data mahasiswa bimbingan yang ditugaskan. Tidak dapat mengubah konfigurasi model atau menghapus akun."
            />
            <RBACRow
              role="mahasiswa"
              scope="Hanya data milik sendiri. Dasbor menampilkan klaster personal + rekomendasi. Tidak pernah melihat data individu mahasiswa lain."
            />
          </div>
        </Section>

        {/* ── Section 05: Cookies & session ────────────────────────── */}
        <Section
          number="05"
          icon={Cookie}
          title="Cookie & manajemen sesi"
        >
          <p className="text-ink/80 mb-4">
            Kami menggunakan cookie seminimal mungkin. Tidak ada cookie
            iklan atau pelacakan lintas-situs.
          </p>

          <div className="border border-hairline divide-y divide-hairline">
            <CookieRow
              name="access_token"
              purpose="Token autentikasi utama (30 menit)."
              flags="HttpOnly · Secure · SameSite=Lax"
            />
            <CookieRow
              name="refresh_token"
              purpose="Token penyegar (7 hari)."
              flags="HttpOnly · Secure · SameSite=Strict"
            />
            <CookieRow
              name="sse_token"
              purpose="Token khusus koneksi waktu nyata (Server-Sent Events)."
              flags="HttpOnly · Secure · SameSite=Lax"
            />
            <CookieRow
              name="monitor-ung-theme"
              purpose="Preferensi tema dasbor (light / dark / system)."
              flags="First-party · Tidak dikirim ke server"
            />
          </div>
        </Section>

        {/* ── Section 06: Notifikasi ──────────────────────────────── */}
        <Section
          number="06"
          icon={Bell}
          title="Notifikasi yang akan Anda terima"
        >
          <ul className="space-y-2.5">
            <BulletRow>
              <strong>Peringatan klaster personal</strong> ketika pola
              penggunaan Anda berpindah ke klaster yang lebih tinggi (mis.
              &quot;Sedang&quot; → &quot;Tinggi&quot;), dengan saran belajar.
            </BulletRow>
            <BulletRow>
              <strong>Pembaruan kebijakan</strong> jika ada perubahan
              material pada dokumen ini, notifikasi akan dikirim 14 hari
              sebelum perubahan berlaku.
            </BulletRow>
            <BulletRow>
              <strong>Insiden keamanan</strong> jika terdeteksi upaya
              akses tidak sah ke akun Anda, email dan notifikasi push akan
              dikirim dalam 1 jam.
            </BulletRow>
          </ul>
          <p className="text-ink/60 text-xs mt-4 leading-relaxed">
            Tidak ada notifikasi promosi, newsletter, atau pesan dari pihak
            ketiga. Preferensi notifikasi dapat dikelola di{" "}
            <Link href="/settings" className="underline underline-offset-4 hover:text-ink">
              Pengaturan
            </Link>
            .
          </p>
        </Section>

        {/* ── Section 07: Hak Anda ────────────────────────────────── */}
        <Section
          number="07"
          icon={KeyRound}
          title="Hak Anda sebagai pemilik data"
        >
          <p className="text-ink/80 mb-4">
            Sesuai dengan{" "}
            <a
              href="https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-4 hover:text-ink"
            >
              UU PDP No. 27 Tahun 2022
            </a>{" "}
            dan praktik GDPR, Anda memiliki hak-hak berikut. Salinan resmi
            UU tersedia sebagai{" "}
            <a
              href="https://peraturan.bpk.go.id/Read/224884/UU%20Nomor%2027%20Tahun%202022.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-4 hover:text-ink"
            >
              PDF
            </a>
            .
          </p>

          <div className="grid sm:grid-cols-2 gap-px bg-hairline border border-hairline">
            <RightCard
              n="A"
              title="Akses"
              body="Meminta salinan seluruh data Anda dalam format JSON atau CSV."
            />
            <RightCard
              n="B"
              title="Koreksi"
              body="Memperbarui data identitas yang tidak akurat (nama, email, prodi)."
            />
            <RightCard
              n="C"
              title="Penghapusan"
              body="Menghapus akun dan seluruh data terkait secara permanen."
            />
            <RightCard
              n="D"
              title="Portabilitas"
              body="Menerima data dalam format terstruktur yang dapat dipindahkan ke layanan lain."
            />
            <RightCard
              n="E"
              title="Penarikan persetujuan"
              body="Mencabut izin penggunaan data tertentu (mis. lokasi) tanpa menghapus akun."
            />
            <RightCard
              n="F"
              title="Keluhan"
              body="Mengadu ke administrator fakultas atau Kemendiktisaintek jika hak Anda tidak dihormati."
            />
          </div>
        </Section>

        {/* ── Section 08: Penghapusan data ────────────────────────── */}
        <Section
          number="08"
          icon={Trash2}
          title="Menghapus data Anda"
        >
          <p className="text-ink/80 mb-4">
            Anda dapat menghapus data dengan dua cara:
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <MethodCard
              icon={Smartphone}
              title="Layanan mandiri lewat aplikasi"
              steps={[
                "Buka aplikasi Monitor UNG di Android.",
                "Masuk ke Pengaturan → Akun → Hapus Data Saya.",
                "Konfirmasi dengan biometrik.",
                "Data lokal dan akun server akan dihapus dalam 24 jam.",
              ]}
            />
            <MethodCard
              icon={Mail}
              title="Permintaan tertulis melalui email"
              steps={[
                "Kirim email ke " + CONTACT_EMAIL + " dari email kampus Anda.",
                "Sertakan NIM dan nama lengkap untuk verifikasi.",
                "Permintaan diproses paling lambat 14 hari kerja.",
                "Anda akan menerima konfirmasi tertulis setelah selesai.",
              ]}
            />
          </div>

          <Callout tone="warning">
            <strong>Perhatian:</strong> Penghapusan bersifat permanen dan
            tidak dapat dibatalkan. Riwayat klaster dan rekomendasi personal
            akan ikut terhapus. Data agregat yang sudah dianonimkan untuk
            riset tidak dapat dilacak kembali ke individu setelah proses
            selesai.
          </Callout>
        </Section>

        {/* ── Section 09: Perubahan kebijakan ─────────────────────── */}
        <Section
          number="09"
          icon={FileText}
          title="Perubahan kebijakan"
        >
          <p className="text-ink/80 mb-4">
            Kami dapat memperbarui dokumen ini untuk mencerminkan perubahan
            fitur, regulasi, atau praktik operasional. Setiap perubahan
            material akan diumumkan terlebih dahulu:
          </p>
          <ul className="space-y-2.5">
            <BulletRow>
              Pemberitahuan di aplikasi minimal 14 hari sebelum berlaku.
            </BulletRow>
            <BulletRow>
              Ringkasan perubahan (<em>changelog</em>) ditampilkan di
              halaman ini dengan versi baru.
            </BulletRow>
            <BulletRow>
              Versi sebelumnya diarsipkan dan dapat diminta melalui email.
            </BulletRow>
          </ul>
        </Section>

        {/* ── Section 10: Kontak ──────────────────────────────────── */}
        <Section number="10" icon={Server} title="Kontak & keluhan">
          <p className="text-ink/80 mb-5">
            Untuk pertanyaan, permintaan akses data, atau keluhan privasi,
            hubungi tim kami:
          </p>

          <div className="border border-hairline divide-y divide-hairline">
            <ContactRow
              label="Email privasi"
              value={CONTACT_EMAIL}
              href={`mailto:${CONTACT_EMAIL}`}
              icon={Mail}
            />
            <ContactRow
              label="Admin prodi"
              value="Hubungi Tata Usaha Fakultas masing-masing"
              icon={Users}
            />
            <ContactRow
              label="Waktu respons"
              value="Maksimal 14 hari kerja"
              icon={Clock}
            />
            <ContactRow
              label="Lokasi pusat data"
              value="VPS UNG · Gorontalo, Indonesia"
              icon={Globe}
            />
          </div>

          <div className="mt-8 pt-6 border-t border-hairline flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-ink/55 hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Beranda
              </Link>
              <p className="text-xs text-ink/55 leading-relaxed">
                © 2026 Universitas Negeri Gorontalo · Monitor UNG
                <br />
                Kebijakan ini diterbitkan di bawah lisensi CC BY-SA 4.0 dan
                dapat direplikasi dengan atribusi.
              </p>
            </div>
            <Link
              href="/changelog"
              className="editorial-ghost px-5 py-2.5 text-xs"
            >
              Changelog
            </Link>
          </div>
        </Section>
      </main>
    </div>
  );
}

// ─── Helper components (kept local to keep page self-contained) ──────

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-sm text-ink/45 mb-1">{label}</dt>
      <dd className="text-sm font-mono text-ink">{value}</dd>
    </div>
  );
}

function Section({
  number,
  icon: Icon,
  title,
  children,
}: {
  number: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12 sm:mb-16 animate-fade-up">
      <header className="flex items-baseline gap-3 mb-5">
        <span className="eyebrow-sm tabular-nums text-ink">{number}</span>
        <h2 className="display-sans text-xl sm:text-2xl text-ink leading-tight flex-1">
          {title}
        </h2>
        <Icon
          className="h-4 w-4 text-ink/40 shrink-0"
          strokeWidth={1.75}
        />
      </header>
      <div className="space-y-5 pl-0 sm:pl-0">{children}</div>
      <div className="rule mt-10 sm:mt-12" />
    </section>
  );
}

function Subsection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow-sm text-ink/55 mb-2.5">{label}</p>
      <div className="text-sm text-ink/80 leading-relaxed">{children}</div>
    </div>
  );
}

function BulletRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 items-start text-sm text-ink/80 leading-relaxed">
      <CircleCheck
        className="h-3.5 w-3.5 text-success mt-1 shrink-0"
        strokeWidth={2}
      />
      <span>{children}</span>
    </li>
  );
}

function TLDRItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="eyebrow-sm tabular-nums text-ink shrink-0 mt-1">
        ·
      </span>
      <span>{children}</span>
    </li>
  );
}

function NumberedItem({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="eyebrow-sm tabular-nums text-ink shrink-0 pt-0.5">
        {n}
      </span>
      <div>
        <p className="font-semibold text-ink mb-1">{title}</p>
        <p className="text-ink/75 leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warning";
  children: React.ReactNode;
}) {
  const borderColor = tone === "warning" ? "border-warning" : "border-primary";
  const label = tone === "warning" ? "Perhatian" : "Catatan";
  const labelColor =
    tone === "warning" ? "text-warning" : "text-ink";

  return (
    <aside
      className={`mt-5 border-l-2 ${borderColor} pl-4 py-2 text-sm text-ink/80 leading-relaxed`}
    >
      <p className={`eyebrow-sm ${labelColor} mb-1.5`}>{label}</p>
      {children}
    </aside>
  );
}

function RBACRow({ role, scope }: { role: string; scope: string }) {
  return (
    <div className="px-5 py-4 bg-paper grid grid-cols-[120px_1fr] gap-4 items-start">
      <code className="font-mono text-xs font-semibold text-ink pt-0.5">
        {role}
      </code>
      <p className="text-sm text-ink/80 leading-relaxed">{scope}</p>
    </div>
  );
}

function CookieRow({
  name,
  purpose,
  flags,
}: {
  name: string;
  purpose: string;
  flags: string;
}) {
  return (
    <div className="px-5 py-4 bg-paper grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 sm:gap-4 items-start">
      <code className="font-mono text-xs text-ink pt-0.5">{name}</code>
      <p className="text-sm text-ink/80 leading-relaxed">{purpose}</p>
      <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink/45 pt-1">
        {flags}
      </p>
    </div>
  );
}

function RightCard({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-paper px-5 py-5">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="eyebrow-sm tabular-nums text-ink">{n}</span>
        <h3 className="font-semibold text-ink text-sm">{title}</h3>
      </div>
      <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
    </div>
  );
}

function MethodCard({
  icon: Icon,
  title,
  steps,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  steps: string[];
}) {
  return (
    <div className="border border-hairline px-5 py-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
        <h3 className="font-semibold text-ink text-sm">{title}</h3>
      </div>
      <ol className="space-y-1.5 list-none">
        {steps.map((s, i) => (
          <li
            key={i}
            className="flex gap-2.5 items-start text-sm text-ink/75 leading-relaxed"
          >
            <span className="eyebrow-sm tabular-nums text-ink/45 shrink-0 mt-1">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ContactRow({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  href?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="px-5 py-4 bg-paper flex items-start gap-3">
      <Icon
        className="h-4 w-4 text-ink/45 mt-0.5 shrink-0"
        strokeWidth={1.75}
      />
      <div className="flex-1 min-w-0">
        <p className="eyebrow-sm text-ink/45 mb-0.5">{label}</p>
        {href ? (
          <a
            href={href}
            className="text-sm text-ink font-semibold underline underline-offset-4 hover:text-ink"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-ink">{value}</p>
        )}
      </div>
    </div>
  );
}
