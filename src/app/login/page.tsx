"use client";
import { useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Eye, EyeOff, Download } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { toast } from "sonner";
import { login } from "@/lib/api";
import { useVersion } from "@/lib/use-version";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Wave 3 fix #11: read version from /api/status instead of hardcoded
  // string — was drifting from /changelog on each release.
  const version = useVersion("v0.22.0");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Login berhasil! Selamat datang.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <PublicHeader />

      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pt-24 pb-12 lg:py-16">
          <ViewTransition name="auth-card">
            <div className="w-full max-w-md">
              <div className="mb-10">
                  <span className="eyebrow-sm text-ink">01 · Masuk</span>
                <h2 className="display text-3xl sm:text-4xl text-ink mt-4 leading-tight">
                  Masuk ke Sistem.
                </h2>
                <p className="text-sm text-ink/70 leading-relaxed mt-4 max-w-sm">
                  Gunakan akun yang telah diberikan oleh admin program studi untuk
                  mengakses dashboard monitoring.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                <div>
                  <label
                    htmlFor="email"
                    className="eyebrow block mb-2"
                  >
                    Alamat Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="nama@ung.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    className="editorial-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="eyebrow">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      className="text-xs text-ink/60 hover:text-ink transition-colors"
                    >
                      Lupa password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="editorial-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ink/50 hover:text-ink transition-colors"
                      aria-label={
                        showPassword ? "Sembunyikan password" : "Tampilkan password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-4">
                  <button
                    type="submit"
                    className="editorial-cta w-full justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memasuki sistem...
                      </>
                    ) : (
                      <>
                        Masuk Sistem
                        <ArrowUpRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <Link href="/register" className="editorial-ghost w-full justify-center">
                    Daftar Akun Baru
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>

                  <a
                    href="https://drive.google.com/drive/folders/1k0x-LaoNRP89DF0cJW2Go-rZS3CzLc_w?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-ghost w-full justify-center"
                  >
                    <Download className="h-4 w-4" />
                    Unduh Aplikasi Mobile
                  </a>
                </div>
              </form>

              <p className="mt-10 text-xs text-ink/55 leading-relaxed">
                Akun mahasiswa atau dosen dapat dibuat sendiri lewat halaman
                pendaftaran. Akun admin dibuat oleh admin lain yang sudah
                memiliki akses.
              </p>
            </div>
          </ViewTransition>
        </div>

        <div className="hidden lg:block px-10 xl:px-16 py-6 border-t border-hairline">
          <p className="text-xs text-ink/55 font-mono">
            monitorterop.my.id · Sistem Monitoring Distraksi · {version}
          </p>
        </div>
      </main>
    </div>
  );
}
