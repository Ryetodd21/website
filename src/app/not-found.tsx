import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PhoneNotFoundIllustration } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />

      <main className="flex flex-col items-center justify-center px-6 py-24 sm:py-32 text-center">
        <div className="h-24 w-24 sm:h-28 sm:w-28 text-primary mb-6">
          <PhoneNotFoundIllustration className="h-full w-full" />
        </div>

        <span className="eyebrow-sm text-ink">404 · Halaman tidak ditemukan</span>

        <h1 className="display-sans text-4xl sm:text-5xl text-ink mt-5 leading-[1.05] tracking-tight">
          Tautan ini sudah usang.
        </h1>

        <p className="text-base text-ink/60 mt-5 max-w-md leading-relaxed">
          Halaman yang Anda cari tidak ada atau telah dipindahkan. Kembali ke beranda,
          atau buka salah satu pintu di bawah.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="editorial-cta"
          >
            Kembali ke Beranda
            <ArrowUpRight />
          </Link>
          <Link
            href="/changelog"
            className="editorial-ghost"
          >
            Lihat Changelog
          </Link>
        </div>

        <div className="mt-16 flex items-center gap-3 eyebrow-sm text-ink/40">
          <span className="h-px w-8 bg-hairline" />
          <span>Monitor UNG · Universitas Negeri Gorontalo</span>
          <span className="h-px w-8 bg-hairline" />
        </div>
      </main>
    </div>
  );
}