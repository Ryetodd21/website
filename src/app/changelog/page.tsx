import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { ChangelogList } from "./_components/changelog-list";

// ─── Editorial Changelog page ────────────────────────────────────────────
// Disederhanakan dari Architecture.md, dokumentasi per-komponen, dan memory.
// Empat lini waktu terpisah: server, ML pipeline, website, aplikasi Android.
// Bahasa mengikuti KBBI, tanpa em-dash, tanpa istilah asing kecuali English.

export const metadata: Metadata = {
  title: "Changelog · Monitor UNG",
  description:
    "Riwayat perubahan Server FastAPI, pipeline machine learning, dasbor web Next.js, dan aplikasi Android Monitor UNG.",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 pb-12 sm:pt-20 sm:pb-16">
        {/* Eyebrow + title block */}
        <div className="mb-10 sm:mb-14 animate-fade-up">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
            <span className="eyebrow-sm text-ink">01 / Catatan Pengembangan</span>
            <span className="eyebrow-sm">Universitas Negeri Gorontalo</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Publik
            </span>
          </div>

          <h1 className="display-sans text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05] uppercase sm:normal-case sm:leading-[1.1]">
            Changelog
            <span className="block display-italic text-ink mt-1 normal-case">
              per kanal komponen.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-ink/60 mt-4 max-w-prose leading-relaxed">
            Ringkasan publik perubahan pada lima komponen sistem Monitor UNG.
            Setiap baris memuat versi, tanggal rilis, sorotan utama, dan daftar
            butir perubahan dalam format singkat. Catatan versi panjang
            tersimpan di dokumentasi internal dan pesan commit repositori.
          </p>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mt-7 pt-5 border-t border-hairline">
            <ChangelogMeta label="Kanal" value="5 komponen" />
            <ChangelogMeta label="Versi terakhir" value="v0.29.0" />
            <ChangelogMeta label="Pembaruan" value="13 November 2026" />
            <ChangelogMeta label="Format" value="Ringkas publik" />
          </dl>
        </div>

        <ChangelogList />
      </main>

      <footer className="border-t border-hairline bg-paper">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-ink/55 hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Beranda
          </Link>
          <span className="text-xs text-ink/60 font-mono">
            © 2026 · Universitas Negeri Gorontalo
          </span>
        </div>
      </footer>
    </div>
  );
}

function ChangelogMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-sm text-ink/45 mb-1">{label}</dt>
      <dd className="text-sm font-mono text-ink">{value}</dd>
    </div>
  );
}
