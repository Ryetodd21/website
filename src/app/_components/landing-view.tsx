"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowUp,
  Lock,
  GitBranch,
  Shield,
  Code2,
  Cloud,
  Bell,
  MapPin,
  BarChart3,
  MessageSquare,
  Activity,
  PieChart,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { useInView } from "@/lib/use-in-view";
import { useVersion } from "@/lib/use-version";
import { useInstitution } from "@/lib/institution";

// ─── Constants ───────────────────────────────────────────────────────────

/**
 * SAIC-pattern nav split:
 * - Topik = direct anchor links (no dropdown) — left side of nav row
 * - Akun / Bantuan = dropdown groups with chevron — right side of nav row
 * Direct links scroll within the landing page; dropdowns link to internal routes.
 */
const TOPIC_LINKS = [
  { label: "Tentang", href: "#tentang" },
  { label: "Sistem", href: "#sistem" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Kontributor", href: "#kontributor" },
] as const;

const CREATOR = {
  name: "Muhammad Hary Bayu Risky",
  role: "Pengembang utama",
  affiliation: "Universitas Negeri Gorontalo",
  githubHandle: "Ryetodd21",
  githubUrl: "https://github.com/Ryetodd21",
  avatarUrl: "https://avatars.githubusercontent.com/u/126993715?v=4",
  bio:
    "Mengembangkan Monitor UNG, dari aplikasi mahasiswa hingga dashboard staf. Berfokus pada pengalaman yang mudah digunakan dan data yang membantu pendampingan akademik.",
};

const UNG_LOGO = "/ung-logo.webp";

const TENETS = [
  {
    title: "Mulai dari persetujuan",
    body: "Pengumpulan data mengikuti persetujuan dan izin aplikasi Android. Pelajari jenis data yang digunakan melalui kebijakan privasi sebelum mengaktifkan monitoring.",
  },
  {
    title: "Baca data dalam konteks",
    body: "Waktu layar harian, penggunaan saat kuliah, dan lokasi kampus dibaca sebagai informasi yang berbeda. Lokasi bukan bukti kehadiran.",
  },
  {
    title: "Dukung pendampingan",
    body: "Kelompok perilaku membantu membuka percakapan dengan mahasiswa. Hasil analisis tidak menggantikan penilaian dosen atau menjelaskan seluruh kondisi belajar.",
  },
  {
    title: "Akses sesuai peran",
    body: "Mahasiswa memakai aplikasi Android. Dosen dan admin memakai dashboard dengan akses data serta tindakan yang dibatasi sesuai kewenangan akun.",
  },
] as const;

const PILLARS = [
  {
    index: "01",
    indexColor: "text-success",
    role: "Mahasiswa · Aplikasi Android",
    title: "Kenali kebiasaan digital",
    body: "Lihat ringkasan penggunaan smartphone, jadwal kuliah, dan status sinkronisasi. Data dikumpulkan sesuai izin yang diberikan pada aplikasi.",
    highlights: ["Jadwal kuliah", "Ringkasan penggunaan", "Histori sinkronisasi"],
  },
  {
    index: "02",
    indexColor: "text-ink",
    role: "Dosen · Dashboard web",
    title: "Dampingi dengan konteks",
    body: "Baca tren aktivitas, jadwal, dan kelompok perilaku mahasiswa. Gunakan laporan serta AI Analisis untuk menyiapkan pertanyaan pendampingan yang lebih terarah.",
    highlights: ["Pemantauan", "Laporan", "AI Analisis"],
  },
  {
    index: "03",
    indexColor: "text-info",
    role: "Admin · Pengelolaan sistem",
    title: "Siapkan lingkungan belajar",
    body: "Tinjau pendaftaran akun, kelola struktur akademik dan titik kampus, serta atur model analisis agar data dapat digunakan sesuai kebutuhan institusi.",
    highlights: ["Persetujuan akun", "Data akademik", "Model analisis"],
  },
] as const;

const STEPS = [
  { num: "01", title: "Daftar dan siapkan akun", body: "Pendaftaran mahasiswa dan dosen ditinjau admin. Setelah akun aktif, mahasiswa masuk ke aplikasi Android dan meninjau persetujuan serta izin monitoring." },
  { num: "02", title: "Kumpulkan aktivitas belajar", body: "Aplikasi mencatat penggunaan smartphone, jumlah membuka kunci, dan lokasi sesuai izin. Jadwal kuliah memberi konteks waktu untuk membaca aktivitas." },
  { num: "03", title: "Sinkronkan saat terhubung", body: "Data disimpan di perangkat sebelum dikirim. Antrean yang belum diakui server tetap menunggu untuk dicoba kembali saat koneksi tersedia." },
  { num: "04", title: "Baca pola, bukan label tetap", body: "PCA dan K-Means membantu mengelompokkan pola aktivitas. Jumlah dan nama kelompok mengikuti model aktif; skor distraksi dibaca terpisah dari nomor kelompok." },
  { num: "05", title: "Tentukan tindak lanjut", body: "Dosen membaca tren dan kelengkapan data melalui dashboard. Hasil analisis menjadi bahan diskusi, dengan tetap mempertimbangkan kondisi setiap mahasiswa." },
] as const;

const FEATURES = [
  { kind: "stream" as const,    title: "Aktivitas terbaru", desc: "Pantau data yang masuk, status koneksi, dan mahasiswa yang belum melakukan sinkronisasi." },
  { kind: "cluster" as const,   title: "Kelompok perilaku", desc: "Lihat pola penggunaan berdasarkan model aktif tanpa menganggap nomor kelompok sebagai urutan risiko." },
  { kind: "trend" as const,     title: "Tren dan laporan", desc: "Bandingkan waktu layar serta hasil pengelompokan antarperiode. Unduh laporan untuk peninjauan lebih lanjut." },
  { kind: "ai" as const,        title: "AI Analisis", desc: "Ajukan pertanyaan tentang konteks data. Periksa kembali jawaban AI sebelum menggunakannya sebagai dasar tindak lanjut." },
  { kind: "lock" as const,      title: "Akses terkelola", desc: "Persetujuan akun dan pembatasan peran menjaga agar tindakan administratif dilakukan oleh pengguna yang berwenang." },
  { kind: "cloud" as const,     title: "Antrean saat offline", desc: "Aplikasi menyimpan data yang belum tersinkronisasi untuk dikirim kembali saat koneksi tersedia." },
  { kind: "pin" as const,       title: "Konteks lokasi", desc: "Baca keterkaitan aktivitas dengan area kampus dan jadwal kuliah. Ketepatan lokasi bergantung pada izin serta perangkat." },
  { kind: "bell" as const,      title: "Pengingat mahasiswa", desc: "Pengingat jadwal dan status monitoring membantu mahasiswa mengikuti aktivitas serta sinkronisasi aplikasi." },
] as const;

const THANKS = [
  { handle: "dsshapr",      githubUrl: "https://github.com/dsshapr",       avatarUrl: "https://avatars.githubusercontent.com/dsshapr?v=4",         contribution: "Memperkenalkan lingkungan Linux dari awal hingga debugging server Linux dan host networking." },
  { handle: "syrauff",      githubUrl: "https://github.com/syrauff",        avatarUrl: "https://avatars.githubusercontent.com/syrauff?v=4",         contribution: "Memperkenalkan environment pengembangan website dan machine learning yang jadi dasar sistem ini." },
  { handle: "rajdeep-3305", githubUrl: "https://github.com/rajdeep-3305",   avatarUrl: "https://avatars.githubusercontent.com/rajdeep-3305?v=4",    contribution: "Membuat perangkat RubyX, devices bertenaga untuk development dan testing Android." },
  { handle: "ramdanolii14", githubUrl: "https://github.com/ramdanolii14",   avatarUrl: "https://avatars.githubusercontent.com/ramdanolii14?v=4",    contribution: "Membantu environment pengembangan Android apps dan menjadi tester aplikasi di berbagai skenario." },
  { handle: "rifqi1146",    githubUrl: "https://github.com/rifqi1146",      avatarUrl: "https://avatars.githubusercontent.com/rifqi1146?v=4",       contribution: "Referensi route AI chat dan fine-tuning model AI chat yang dipakai di fitur asisten sistem." },
  { handle: "tiann",        githubUrl: "https://github.com/tiann",          avatarUrl: "https://avatars.githubusercontent.com/tiann?v=4",           contribution: "Membuat debugging aplikasi jauh lebih mudah lewat akses superuser (root) di perangkat Android." },
  { handle: "DP-Hridayan",  githubUrl: "https://github.com/DP-Hridayan",    avatarUrl: "https://avatars.githubusercontent.com/DP-Hridayan?v=4",     contribution: "Membuat Ashellyou, alat yang mempermudah proses debugging selama pengembangan sistem." },
] as const;

// (FOOTER_NAV is reserved for future use; nav links are currently inlined
// inside FooterNavColumn below.)

// ─── Animation + layout primitives ──────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`${inView ? "in-view" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`max-w-6xl mx-auto px-6 sm:px-8 ${className}`}>{children}</div>;
}

function Section({
  children,
  id,
  bg = "",
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  bg?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`${bg} py-20 sm:py-28 ${className}`}>
      {children}
    </section>
  );
}

/**
 * EyebrowLabel — small uppercase label with a leading colored dot. SAIC pattern.
 */
function EyebrowLabel({
  children,
  color = "text-success",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span className={`eyebrow inline-flex items-center ${color}`}>
      <span className="eyebrow-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

// ─── Inline SVG illustrations (line-only, ink-tinted) ────────────────────

function StudyIllustration() {
  return (
    <figure className="mx-auto w-full max-w-[360px]">
      <svg viewBox="0 0 360 280" className="w-full h-auto text-primary" aria-hidden="true">
        <circle cx="190" cy="135" r="118" fill="currentColor" opacity="0.06" />
        <rect x="72" y="48" width="258" height="174" rx="14" fill="var(--paper)" stroke="var(--hairline)" strokeWidth="2" />
        <path d="M72 82h258" stroke="var(--hairline)" strokeWidth="2" />
        <circle cx="91" cy="65" r="4" fill="currentColor" />
        <path d="M106 65h65M96 103h78" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" opacity="0.65" />
        <path d="M96 132h210M96 158h210M96 184h210" stroke="var(--hairline)" strokeDasharray="3 5" />
        <path d="M100 174l40-19 38 8 42-36 38 9 43-29" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="220" cy="127" r="5" fill="currentColor" />
        <circle cx="301" cy="107" r="5" fill="currentColor" />
        <path d="M177 222v22m-34 0h68" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        <rect x="22" y="114" width="91" height="144" rx="16" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        <path d="M55 125h25M56 246h23" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="68" cy="170" r="24" fill="currentColor" opacity="0.1" />
        <path d="M55 170l9 9 17-20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42 211h51M42 222h34" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      </svg>
      <figcaption className="mt-3 text-center text-xs text-ink/65">Ilustrasi aktivitas mahasiswa dan ringkasan staf</figcaption>
    </figure>
  );
}

/**
 * Pipeline connector — horizontal line with 5 numbered nodes for the
 * Cara Kerja section. Uses <foreignObject>-free SVG so it can be inlined
 * inside dark theme on tinted backgrounds without clipping issues.
 */
function PipelineConnector() {
  // Compute positions for 5 evenly spaced nodes along the line.
  const positions = [40, 130, 220, 310, 400];
  return (
    <svg
      viewBox="0 0 440 70"
      className="w-full h-auto max-w-[640px] mx-auto text-primary reveal-draw"
      aria-hidden="true"
    >
      <line
        x1={positions[0]}
        y1="35"
        x2={positions[positions.length - 1]}
        y2="35"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.5"
      />
      {positions.map((x, i) => (
        <g key={i} className="text-ink">
          <circle
            cx={x}
            cy="35"
            r="14"
            fill="var(--paper)"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <text
            x={x}
            y="35"
            dominantBaseline="central"
            textAnchor="middle"
            fontFamily="var(--font-fraunces), serif"
            fontSize="11"
            fontWeight="600"
            fill="currentColor"
          >
            {String(i + 1).padStart(2, "0")}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Feature icon — picks a Lucide SVG via switch on `kind`.
 * 24x24, currentColor stroke so it inherits section tint.
 */
function FeatureIcon({ kind }: { kind: (typeof FEATURES)[number]["kind"] }) {
  const props = { className: "w-7 h-7", strokeWidth: 1.5, "aria-hidden": true } as const;
  switch (kind) {
    case "stream":  return <Activity {...props} />;
    case "cluster": return <PieChart {...props} />;
    case "trend":   return <BarChart3 {...props} />;
    case "ai":      return <MessageSquare {...props} />;
    case "lock":    return <Lock {...props} />;
    case "cloud":   return <Cloud {...props} />;
    case "pin":     return <MapPin {...props} />;
    case "bell":    return <Bell {...props} />;
  }
}

// ─── Marquee strip — SAIC-pattern horizontal ticker ─────────────────────

const MARQUEE_ITEMS = [
  "PCA + K-Means",
  "FastAPI",
  "Next.js",
  "Kotlin Compose",
  "PostgreSQL",
  "MQTT",
  "Recharts",
  "SQLCipher",
  "REST + WebSocket",
  "Real-time",
  "JWT HttpOnly",
] as const;

function MarqueeStrip() {
  // Duplicate items so the slide loop is seamless (-50% returns to start).
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="bg-ink py-6 sm:py-7 border-y border-paper/10">
      <Container>
        <div className="marquee" aria-label="Teknologi pendukung">
          <div className="marquee-track">
            {doubled.map((item, i) => (
              <span key={i} className="marquee-item text-paper/85">
                <span>{item}</span>
                <span className="marquee-dot text-warning" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

// ─── Landing-specific: scroll-to-top bullet (always-visible sticky at bottom-left) ─

function ScrollToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      className="scroll-top-bullet"
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}


// ─── Hero (paper bg, asymmetric editorial) ───────────────────────────────

function Hero() {
  const { profile: institution } = useInstitution();
  return (
    <section className="pt-32 sm:pt-44 pb-20 sm:pb-32 relative overflow-hidden">
      {/* Editorial Softened: subtle radial warmth from top-left */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 15% 0%, oklch(0.577 0.245 27.325 / 0.015) 0%, transparent 100%)",
        }}
      />

      <Container>
        <Reveal className="mb-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-ink" />
            <span className="eyebrow">
              Riset &amp; Akademik · {institution.universityName || "Universitas Negeri Gorontalo"}
            </span>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-12 gap-10 items-end">
          <Reveal delay={80} className="sm:col-span-8">
            <h1 aria-label="Monitor UNG" className="display-sans-black flex flex-col uppercase text-[clamp(3rem,10vw,8.5rem)] text-ink leading-[0.95]">
              <CyclingWord
                words={["Monitor", "Imato"]}
                interval={2000}
              />
              <span>UNG</span>
            </h1>
          </Reveal>

          <Reveal delay={200} className="sm:col-span-4">
            <StudyIllustration />
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-12 gap-6 mt-14">
          <Reveal delay={260} className="sm:col-span-7">
            <p className="text-base sm:text-lg text-ink/75 leading-relaxed max-w-xl">
              Pahami kebiasaan digital, dukung proses belajar.
              Monitor UNG menghubungkan aktivitas smartphone, jadwal kuliah, dan
              konteks kampus agar mahasiswa serta dosen dapat menentukan langkah
              pendampingan berdasarkan data.
            </p>
          </Reveal>

          <Reveal delay={320} className="sm:col-span-5">
            <div className="flex flex-col sm:items-end gap-3">
              <Link href="/login" className="editorial-cta">
                Masuk Sistem
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href="#sistem" className="editorial-ghost">
                Pelajari Sistem
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={400}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10 mt-20 sm:mt-28 pt-10 border-t border-hairline">
            {[
              { value: "Android", label: "Aplikasi mahasiswa", size: "text-3xl sm:text-4xl" },
              { value: "Web", label: "Dashboard dosen & admin", size: "text-4xl sm:text-5xl" },
              { value: "PCA", label: "Analisis bersama K-Means", size: "text-4xl sm:text-5xl" },
              { value: "WITA", label: "Waktu kegiatan akademik", size: "text-4xl sm:text-5xl" },
            ].map((m) => (
              <div key={m.label}>
                <p className={`display ${m.size} text-ink leading-[0.85]`}>{m.value}</p>
                <p className="eyebrow-sm mt-3 text-ink/65">{m.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

// ─── Manifesto / Tentang (amber-tint) ───────────────────────────────────

function Manifesto() {
  return (
    <Section id="tentang" bg="bg-section-amber">
      <Container>
        <Reveal>
          <EyebrowLabel color="text-success">Tentang</EyebrowLabel>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="display-sans text-4xl sm:text-5xl lg:text-6xl text-ink mt-6 leading-[0.95] max-w-4xl">
            Pahami kebiasaan. <span className="display-italic">Dampingi proses belajar.</span>
          </h2>
        </Reveal>

        <Reveal delay={180} className="max-w-3xl mt-10">
          <p className="text-base sm:text-lg text-ink/80 leading-relaxed">
            Angka penggunaan smartphone tidak menceritakan semuanya.
            Monitor UNG membantu dosen melihat pola dan kelengkapan data sebelum
            berdiskusi dengan mahasiswa tentang kebiasaan belajar mereka.
          </p>
        </Reveal>

        {/* 2×2 tenets grid (replaces the previous vertical list) */}
        <div className="grid md:grid-cols-2 mt-16 sm:mt-24">
          {TENETS.map((t, i) => {
            return (
              <Reveal
                key={t.title}
                delay={i * 60}
                className={`tenet-card p-8 sm:p-10 lg:p-12 border-hairline ${
                  i < 2 ? "border-b" : ""
                } ${i % 2 === 0 ? "md:border-r" : ""}`}
              >
                <div className="flex items-start justify-between gap-6 mb-6">
                  <span className={`eyebrow-sm ${i === 1 ? "text-ink" : i === 2 ? "text-info" : i === 3 ? "text-warning" : "text-success"}`}>
                    Prinsip {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="display-sans text-2xl sm:text-3xl text-ink leading-tight">
                  {t.title}
                </h3>
                <p className="text-base text-ink/80 leading-relaxed mt-5">
                  {t.body}
                </p>
              </Reveal>
            );
          })}
        </div>

        {/* Pull quote — serif italic, set on the same warm field */}
        <Reveal delay={300}>
          <div className="mt-16 sm:mt-24 max-w-3xl">
            <p className="display-italic text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05]">
              &ldquo;Data membuka percakapan. Pendampingan tetap melibatkan manusia.&rdquo;
            </p>
            <p className="eyebrow-sm mt-6 text-ink/55">
              Pendekatan Monitor UNG
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

// ─── Architecture / Sistem (brand tint) ──────────────────────────────────

function Architecture() {
  return (
    <Section id="sistem" bg="bg-section-brand">
      <Container>
        <Reveal>
          <EyebrowLabel color="text-ink">Untuk Pengguna</EyebrowLabel>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="display-sans text-4xl sm:text-5xl lg:text-6xl text-ink mt-6 leading-[0.95] max-w-4xl">
            Satu sistem, tiga peran yang saling mendukung.
          </h2>
        </Reveal>

        <Reveal delay={180} className="max-w-3xl mt-8">
          <p className="text-base sm:text-lg text-ink/80 leading-relaxed">
            Mahasiswa memahami aktivitasnya, dosen meninjau pola belajar,
            dan admin menyiapkan data akademik. Setiap peran memiliki ruang kerja
            serta kewenangannya sendiri.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 mt-16 sm:mt-20 border-t border-hairline">
          {PILLARS.map((p, i) => {
            return (
              <Reveal
                key={p.index}
                delay={120 + i * 80}
                className={`pillar-card p-8 sm:p-10 lg:p-12 border-hairline md:border-b-0 border-b last:border-b-0 ${
                  i < 2 ? "md:border-r" : ""
                }`}
              >
                <span className={`eyebrow-sm ${p.indexColor} block`}>
                  Peran {p.index}
                </span>
                <p className="eyebrow mt-2">{p.role}</p>
                <h3 className="display-sans text-2xl sm:text-3xl text-ink mt-3 leading-tight">
                  {p.title}
                </h3>
                <p className="text-base text-ink/80 leading-relaxed mt-5">
                  {p.body}
                </p>
                <div className="mt-8 pt-6 border-t border-hairline">
                  <p className="eyebrow-sm mb-3">Ruang kerja</p>
                  <div className="flex flex-wrap gap-2">
                    {p.highlights.map((t) => (
                      <span key={t} className="tag-pill text-ink/70">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// ─── Cara Kerja (teal-tint) ─────────────────────────────────────────────

function HowItWorks() {
  return (
    <Section id="cara-kerja" bg="bg-section-teal">
      <Container>
        <Reveal>
          <EyebrowLabel color="text-success">Cara Kerja</EyebrowLabel>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="display-sans text-4xl sm:text-5xl lg:text-6xl text-ink mt-6 leading-[0.95] max-w-4xl">
            Dari persetujuan hingga pendampingan.
          </h2>
        </Reveal>

        <Reveal delay={200} className="mt-16 sm:mt-20">
          <PipelineConnector />
        </Reveal>

        {/* Step list — 2 columns on wide screens for density */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-0 mt-12">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.num}
              delay={i * 50}
              className="step-item py-8 border-t border-hairline flex gap-6"
            >
              <span className="step-node text-success shrink-0">{s.num}</span>
              <div>
                <h3 className="display-sans text-xl sm:text-2xl text-ink leading-tight">
                  {s.title}
                </h3>
                <p className="text-base text-ink/80 leading-relaxed mt-3">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ─── Fitur (fuchsia-tint, 2x4 grid cards) ───────────────────────────────

function Features() {
  return (
    <Section id="fitur" bg="bg-section-fuchsia">
      <Container>
        <Reveal>
          <EyebrowLabel color="text-warning">Fitur</EyebrowLabel>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="display-sans text-4xl sm:text-5xl lg:text-6xl text-ink mt-6 leading-[0.95] max-w-4xl">
            Sekilas kemampuan utama sistem.
          </h2>
        </Reveal>

        <Reveal delay={180} className="max-w-3xl mt-8">
          <p className="text-base sm:text-lg text-ink/80 leading-relaxed">
            Mulai dari ringkasan aktivitas hingga peninjauan laporan.
            Periksa kelengkapan data dan konteks mahasiswa sebelum mengambil kesimpulan.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 mt-16 sm:mt-20 border-t border-hairline">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 50}
              className="feature-card p-6 sm:p-8 border-hairline border-b lg:border-b-0 sm:[&:nth-child(2n)]:border-r lg:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(4n-3)]:border-r [&:nth-last-child(-n+2)]:sm:border-b-0 [&:nth-last-child(-n+4)]:lg:border-b-0"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-ink feature-card-icon">{f.kind ? <FeatureIcon kind={f.kind} /> : null}</span>
                <span className="eyebrow-sm text-ink/55">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="display-sans text-xl text-ink leading-tight">
                {f.title}
              </h3>
              <p className="text-sm text-ink/80 leading-relaxed mt-3">
                {f.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ─── Tech Stack (paper — visual rest between tints) ─────────────────────

function TechStack() {
  // Tiap tech punya tautan ke dokumentasi / situs resminya. `home` dipakai
  // untuk kategori abstrak (RBAC, dll) yang tidak punya satu halaman
  // dokumentasi, tetap ditautkan ke repo bila tersedia, atau ke anchor
  // kosong sebagai fallback.
  const groups: { label: string; items: { name: string; url: string }[] }[] = [
    {
      label: "Backend",
      items: [
        { name: "FastAPI",       url: "https://fastapi.tiangolo.com/" },
        { name: "Python",        url: "https://www.python.org/" },
        { name: "PostgreSQL",    url: "https://www.postgresql.org/docs/" },
        { name: "Redis",         url: "https://redis.io/docs/" },
        { name: "MQTT Mosquitto",url: "https://mosquitto.org/documentation/" },
        { name: "WebSocket",     url: "https://developer.mozilla.org/docs/Web/API/WebSockets_API" },
        { name: "scikit-learn",  url: "https://scikit-learn.org/stable/" },
      ],
    },
    {
      label: "Frontend",
      items: [
        { name: "Next.js",       url: "https://nextjs.org/docs" },
        { name: "React 19",      url: "https://react.dev/" },
        { name: "TypeScript",    url: "https://www.typescriptlang.org/docs/" },
        { name: "Tailwind v4",   url: "https://tailwindcss.com/docs" },
        { name: "Recharts",      url: "https://recharts.org/en-US/" },
        { name: "WebSocket",     url: "https://developer.mozilla.org/docs/Web/API/WebSockets_API" },
      ],
    },
    {
      label: "Mobile",
      items: [
        { name: "Kotlin",            url: "https://kotlinlang.org/docs/home.html" },
        { name: "Jetpack Compose",   url: "https://developer.android.com/develop/ui/compose" },
        { name: "Hilt",              url: "https://developer.android.com/training/dependency-injection/hilt-android" },
        { name: "Room",              url: "https://developer.android.com/training/data-storage/room" },
        { name: "SQLCipher",         url: "https://www.zetetic.net/sqlcipher/sqlcipher-for-android/" },
        { name: "WorkManager",       url: "https://developer.android.com/topic/libraries/architecture/workmanager" },
      ],
    },
    {
      label: "ML & Data",
      items: [
        { name: "PCA",                url: "https://scikit-learn.org/stable/modules/decomposition.html#pca" },
        { name: "K-Means",            url: "https://scikit-learn.org/stable/modules/clustering.html#k-means" },
        { name: "Silhouette",         url: "https://scikit-learn.org/stable/modules/clustering.html#silhouette-coefficient" },
        { name: "Feature Engineering",url: "https://scikit-learn.org/stable/modules/feature_extraction.html" },
      ],
    },
    {
      label: "Security",
      items: [
        { name: "JWT HttpOnly", url: "https://owasp.org/www-community/HttpOnly" },
        { name: "bcrypt",       url: "https://en.wikipedia.org/wiki/Bcrypt" },
        { name: "slowapi",      url: "https://slowapi.readthedocs.io/en/latest/" },
        { name: "RBAC",         url: "https://en.wikipedia.org/wiki/Role-based_access_control" },
        { name: "Biometric",    url: "https://developer.android.com/training/sign-in/biometric-auth" },
      ],
    },
  ];
  return (
    <Section id="teknologi">
      <Container>
        <Reveal>
          <EyebrowLabel color="text-ink">Teknologi Pendukung</EyebrowLabel>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="display-sans text-3xl sm:text-4xl lg:text-5xl text-ink mt-6 leading-[0.95] max-w-3xl">
            Teknologi di balik sistem.
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <p className="text-base sm:text-lg text-ink/65 leading-relaxed mt-6 max-w-2xl">
            Setiap komponen punya tautan ke dokumentasi resminya, klik untuk
            mempelajari lebih lanjut.
          </p>
        </Reveal>

        <div className="mt-12 sm:mt-16 border-t border-hairline">
          {groups.map((g, gi) => (
            <Reveal
              key={g.label}
              delay={gi * 40}
              className="py-6 sm:py-8 border-b border-hairline"
            >
              <div className="grid sm:grid-cols-12 gap-6 items-center">
                <span className="eyebrow-sm sm:col-span-3 text-ink/55">{g.label}</span>
                <div className="sm:col-span-9 flex flex-wrap gap-2">
                  {g.items.map((it) => (
                    <a
                      key={it.name}
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tag-pill text-ink/70 hover:text-ink hover:border-primary hover:bg-primary/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                    >
                      {it.name}
                      <ArrowUpRight className="h-3 w-3 opacity-50" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ─── Team (brand tint) ───────────────────────────────────────────────────

function Team() {
  return (
    <Section id="tim" bg="bg-section-brand">
      <Container>
        <Reveal>
          <EyebrowLabel color="text-success">Tim Pengembang</EyebrowLabel>
        </Reveal>

        <Reveal delay={80} className="grid sm:grid-cols-12 gap-10 lg:gap-16 mt-10">
          <div className="sm:col-span-4">
            <Image
              src={CREATOR.avatarUrl}
              alt={`Foto ${CREATOR.name}`}
              width={240}
              height={240}
              className="team-avatar w-full aspect-square object-cover"
            />
          </div>
          <div className="sm:col-span-8">
            <span className="eyebrow-sm text-ink">01 · Pengembang</span>
            <h2 className="display-sans text-3xl sm:text-4xl lg:text-5xl text-ink mt-4 leading-tight">
              {CREATOR.name}
            </h2>
            <p className="eyebrow mt-3">
              {CREATOR.role} · {CREATOR.affiliation}
            </p>
            <p className="text-base sm:text-lg text-ink/80 leading-relaxed mt-8 max-w-2xl">
              {CREATOR.bio}
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <a
                href={CREATOR.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-cta"
              >
                GitHub · @{CREATOR.githubHandle}
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href="#kontributor" className="editorial-ghost">
                Lihat Kontributor
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

// ─── Contributors (amber-light, 3+4 grid) ───────────────────────────────

function Contributors() {
  return (
    <Section id="kontributor" bg="bg-section-amber">
      <Container>
        <Reveal>
          <EyebrowLabel color="text-warning">Kontributor</EyebrowLabel>
        </Reveal>

        <Reveal delay={80} className="max-w-3xl mt-6">
          <h2 className="display-sans text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
            Terima kasih atas bimbingan dan kontribusinya.
          </h2>
        </Reveal>

        <div className="mt-12 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-hairline border border-hairline">
          {THANKS.map((p, i) => (
            <Reveal
              key={p.handle}
              delay={i * 40}
              className="contributor-card bg-section-amber p-6 sm:p-8 flex flex-col"
            >
              <Image
                src={p.avatarUrl}
                alt={`@${p.handle}`}
                width={56}
                height={56}
                className="contributor-avatar h-14 w-14 rounded-full object-cover"
              />
              <span className="font-mono text-sm text-ink mt-4">
                @{p.handle}
              </span>
              <p className="text-sm text-ink/80 leading-relaxed mt-3 flex-1">
                {p.contribution}
              </p>
              <a
                href={p.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs eyebrow-sm text-warning mt-5 hover:text-ink transition-colors inline-flex items-center gap-1"
              >
                Kunjungi
                <ArrowUpRight className="h-3 w-3" strokeWidth={2.25} />
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function LandingFooter() {
  // Footer sits on bg-section-ink (hardcoded dark slab). Use the
  // Wave 3 fix #11: read version from /api/status (hoisted here from
  // LandingView so the Footer can use the value too).
  const version = useVersion("v0.22.0");
  const { profile: institution } = useInstitution();
  const instName = institution.universityName || "Universitas Negeri Gorontalo";
  // text-on-section-ink/* utilities instead of text-paper/* — in dark mode
  // --paper flips to dark and paper-text collapses to invisible.
  return (
    <footer className="bg-section-ink">
      <Container className="py-20 sm:py-28">
        <div className="grid sm:grid-cols-12 gap-10">
          {/* Brand + address block */}
          <div className="sm:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src={UNG_LOGO}
                alt="UNG"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="display-sans-uc text-base text-on-section-ink tracking-[0.12em]">Monitor UNG</span>
            </div>
            <p className="text-sm text-on-section-ink/70 leading-relaxed max-w-md">
              Sistem monitoring distraksi belajar mahasiswa berbasis PCA &amp;
              K-Means. Dikembangkan untuk kebutuhan riset dan akademik di
              {instName}.
            </p>
            <address className="not-italic mt-8 text-xs text-on-section-ink/55 font-mono leading-relaxed">
              {instName}
              <br />
              Jl. Jend. Sudirman No.6, Kota Gorontalo
              <br />
              Provinsi Gorontalo, Indonesia 96128
            </address>
          </div>

          {/* 3-col nav dense */}
          <div className="sm:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            <div>
              <span className="eyebrow-sm text-on-section-ink/45">Sistem</span>
              {TOPIC_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="footer-nav-row text-on-section-ink/80 hover:text-on-section-ink"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div>
              <span className="eyebrow-sm text-on-section-ink/45">Akun</span>
              <Link href="/login" className="footer-nav-row text-on-section-ink/80">
                Masuk Sistem
              </Link>
              <Link href="/register" className="footer-nav-row text-on-section-ink/80">
                Daftar
              </Link>
              <Link href="/privacy" className="footer-nav-row text-on-section-ink/80">
                Kebijakan Privasi
              </Link>
            </div>
            <div>
              <span className="eyebrow-sm text-on-section-ink/45">Lainnya</span>
              <a
                href="/changelog"
                className="footer-nav-row text-on-section-ink/80 hover:text-on-section-ink"
              >
                Changelog
              </a>
              <a
                href="https://saic.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-nav-row text-on-section-ink/80"
              >
                Referensi Desain
              </a>
            </div>
          </div>
        </div>

        {/* Baris 2: lisensi + source code + privasi + build */}
        <div className="mt-8 pt-4 border-t border-on-section-ink/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-on-section-ink/55">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Akademik &amp; Riset Internal
            </span>
            <span className="text-on-section-ink/20">·</span>
            <a
              href={CREATOR.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-on-section-ink/55 hover:text-on-section-ink transition-colors"
            >
              <Code2 className="h-3.5 w-3.5 shrink-0" />
              Profil Pengembang
            </a>
            <span className="text-on-section-ink/20">·</span>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-xs text-on-section-ink/55 hover:text-on-section-ink transition-colors"
            >
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Kebijakan Privasi
            </Link>
            <span className="text-on-section-ink/20">·</span>
            <span className="text-xs text-on-section-ink/55 font-mono">
              {version} · build 2026
            </span>
          </div>
        </div>

        {/* Baris 3: copyright + build by */}
        <div className="mt-6 pb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-on-section-ink/55">
            © 2026 {instName} · Sistem Monitoring Distraksi
          </p>
          <a
            href={CREATOR.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-on-section-ink/55 hover:text-on-section-ink transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5 shrink-0" />
            Dikembangkan oleh {CREATOR.name}
          </a>
        </div>
      </Container>
    </footer>
  );
}

// ─── Root view ───────────────────────────────────────────────────────────

export function LandingView() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <main>
        <Hero />
        <MarqueeStrip />
        <Manifesto />
        <Architecture />
        <HowItWorks />
        <Features />
        <TechStack />
        <Team />
        <Contributors />
      </main>
      <LandingFooter />
      <ScrollToTop />
    </div>
  );
}

// ─── Cycling word: gentian bahasa daerah Indonesia ───────────────────────

interface CyclingWordProps {
  words: string[];
  interval?: number;
  className?: string;
}

// Keep both title lines fixed while the local-language accent changes.
function CyclingWord({ words, interval = 2000, className }: CyclingWordProps) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || words.length < 2) return;
    const id = setInterval(() => {
      setI((p) => (p + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  const isImato = words[i] === "Imato";

  return (
    <span className={`relative block pb-6 ${className ?? ""}`} aria-hidden="true">
      <span
        key={i}
        className={isImato ? "inline-block cycle-imato animate-cycle-fade" : "inline-block animate-cycle-fade"}
      >
        {words[i]}
      </span>
      {isImato ? (
        <span className="cycle-imato-label" aria-hidden="true">
          Gorontalo
        </span>
      ) : (
        <span className="cycle-imato-label-slot" aria-hidden="true">
          Gorontalo
        </span>
      )}
    </span>
  );
}

// ─── end of CyclingWord ───────────────────────────────────────────────────
