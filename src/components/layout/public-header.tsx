"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X, ChevronDown } from "lucide-react";
// ThemeToggle moved out of the header chrome into a floating bottom-right
// widget, rendered below so the toggle stays visible while scrolling and
// doesn't compete with the wordmark + Masuk CTA for header real estate.
import { ThemeToggle } from "@/components/theme-toggle";

// ─── Shared landing-style public header ────────────────────────────────────
//
// Digunakan di semua halaman publik kecuali dashboard:
//   /, /login, /register, /privacy, /changelog.
//
// Logo + nav utama + dropdown Akun + dropdown Bantuan + theme toggle +
// CTA "Masuk Sistem" di kanan. Background transparan di atas, paper
// saat di-scroll, hairline border bawah. Pattern SAIC homepage.

const UNG_LOGO = "/ung-logo.webp";

const TOPIC_LINKS = [
  { label: "Tentang", href: "#tentang" },
  { label: "Sistem", href: "#sistem" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Kontributor", href: "#kontributor" },
] as const;

const BANTUAN_ITEMS: ReadonlyArray<{ label: string; href: string; external?: boolean }> = [
  { label: "Kebijakan Privasi", href: "/privacy", external: false },
  { label: "Changelog",        href: "/changelog", external: false },
  { label: "Status Sistem",    href: "/monitoring", external: false },
  { label: "Dokumentasi API",  href: "/#sistem", external: false },
];

const ACCOUNT_ITEMS: ReadonlyArray<{ label: string; href: string; external?: boolean }> = [
  { label: "Masuk Sistem",   href: "/login", external: false },
  { label: "Daftar Akun",    href: "/register", external: false },
  { label: "Profil Saya",    href: "/profile", external: false },
  { label: "Pengaturan",     href: "/settings", external: false },
];

function NavDropdown({
  label,
  items,
  align = "left",
}: {
  label: string;
  items: ReadonlyArray<{ label: string; href: string; external?: boolean }>;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  // Round 27 audit (P1): clear any pending close timer on unmount so a
  // fast route change while the 140ms debounce is still pending does not
  // fire setOpen(false) on an unmounted fiber. Pattern mirrors the
  // Round 26 fix in app-sidebar.tsx:64-71.
  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => {
          cancelClose();
          setOpen((v) => !v);
        }}
        className="nav-topik nav-dropdown-trigger"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className="h-3 w-3 nav-dropdown-chevron" strokeWidth={2.5} />
      </button>
      {open && (
        <div
          className={`nav-dropdown-panel ${align === "right" ? "right-0 left-auto" : ""}`}
          role="menu"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {items.map((it) =>
            it.external ? (
              <a
                key={it.href}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-dropdown-item"
                role="menuitem"
                onClick={() => {
                  cancelClose();
                  setOpen(false);
                }}
              >
                {it.label}
              </a>
            ) : (
              <Link
                key={it.href}
                href={it.href}
                className="nav-dropdown-item"
                role="menuitem"
                onClick={() => {
                  cancelClose();
                  setOpen(false);
                }}
              >
                {it.label}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
          scrolled ? "bg-paper/95 backdrop-blur-sm" : "bg-transparent"
        } border-b border-hairline`}
      >
      <div className="max-w-6xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <Image
            src={UNG_LOGO}
            alt="Universitas Negeri Gorontalo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="display-sans-uc text-sm tracking-[0.18em] text-ink">Monitor UNG</span>
            <span className="eyebrow-sm mt-1">Universitas Negeri Gorontalo</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center">
          {TOPIC_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-topik">
              {l.label}
            </a>
          ))}
          <NavDropdown label="Akun" items={ACCOUNT_ITEMS} />
          <NavDropdown label="Bantuan" items={BANTUAN_ITEMS} />
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-base font-semibold text-ink hover:text-ink transition-colors px-3 py-2"
          >
            Masuk Sistem
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden h-10 w-10 flex items-center justify-center"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-hairline bg-paper">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4">
            <nav className="flex flex-col">
              <span className="eyebrow text-ink/55 px-3 pt-2 pb-2">Topik</span>
              {TOPIC_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="nav-topik border-b border-hairline last:border-0"
                  style={{ paddingLeft: "0.75rem" }}
                >
                  {l.label}
                </a>
              ))}

              <span className="eyebrow text-ink/55 px-3 pt-5 pb-2">Akun</span>
              {ACCOUNT_ITEMS.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setMenuOpen(false)}
                  className="nav-topik border-b border-hairline"
                  style={{ paddingLeft: "0.75rem" }}
                >
                  {it.label}
                </Link>
              ))}

              <span className="eyebrow text-ink/55 px-3 pt-5 pb-2">Bantuan</span>
              {BANTUAN_ITEMS.map((it) =>
                it.external ? (
                  <a
                    key={it.href}
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="nav-topik border-b border-hairline"
                    style={{ paddingLeft: "0.75rem" }}
                  >
                    {it.label}
                  </a>
                ) : (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setMenuOpen(false)}
                    className="nav-topik border-b border-hairline"
                    style={{ paddingLeft: "0.75rem" }}
                  >
                    {it.label}
                  </Link>
                ),
              )}

              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="editorial-cta justify-center mt-6"
              >
                Masuk Sistem
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </div>
      )}
      </header>
      {/* Floating theme toggle — fixed bottom-right, mirrors a back-button
          position. Lives at the layout level so it doesn't compete with the
          wordmark + Masuk CTA for header real estate. */}
      <ThemeToggle floating />
    </>
  );
}
