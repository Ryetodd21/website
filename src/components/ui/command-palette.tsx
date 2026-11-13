"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, History, LogOut, RefreshCw, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, logout } from "@/lib/api";
import { useUserProfile } from "@/lib/user-profile";
import { STAFF_ROLES } from "@/components/auth/role-gate";
import { accountNavigation, staffNavigation } from "@/components/layout/navigation";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEARCH_AUTOCOMPLETE_LIMIT, SEARCH_DEBOUNCE_MS } from "@/lib/limits";

export function CommandPalette() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const isStaff = STAFF_ROLES.includes(profile.role.toLowerCase().trim());
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<{ full_name: string; nim: string; id: string }[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">("idle");
  const [retry, setRetry] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const changeOpen = useCallback((value: boolean) => {
    setOpen(value);
    if (!value) { setQuery(""); setStudents([]); setSearchState("idle"); }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        changeOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, changeOpen]);

  useEffect(() => {
    if (!open || !isStaff || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchState("loading");
      try {
        const response = await apiFetch<{ items: { full_name: string; nim: string; id: string }[] }>(`/api/students?search=${encodeURIComponent(query.trim())}&page_size=${SEARCH_AUTOCOMPLETE_LIMIT}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setStudents(response.items); setSearchState("idle"); }
      } catch {
        if (!controller.signal.aborted) setSearchState("error");
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, query, isStaff, retry]);

  function go(href: string) {
    changeOpen(false);
    router.push(href);
  }

  const pages = (isStaff ? [...staffNavigation, accountNavigation] : [accountNavigation])
    .filter(item => `${item.label} ${item.href}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={changeOpen}>

      <DialogTrigger render={<button
        type="button"
        aria-label="Cari halaman atau mahasiswa"
        className="flex h-11 min-w-11 items-center justify-center gap-3 rounded-lg border border-hairline bg-card px-3 text-muted-foreground hover:border-primary hover:text-ink lg:min-w-64 lg:justify-start"
      >

        <Search className="size-5" aria-hidden="true" />
        <span className="hidden text-sm lg:inline">Cari halaman, mahasiswa...</span>
        <kbd className="ml-auto hidden text-xs xl:inline">Ctrl K</kbd>
      </button>} />

      <DialogContent initialFocus={inputRef} showCloseButton={false} className="bg-card p-0 sm:max-w-xl">

        <div className="flex items-start justify-between gap-3 px-5 pt-5">

          <div>
            <DialogTitle className="text-xl font-bold">Pencarian</DialogTitle>
            <DialogDescription className="mt-2">Temukan halaman atau mahasiswa. Gunakan Tab atau tombol panah untuk memilih.</DialogDescription>
          </div>

          <DialogClose render={<Button variant="ghost" className="size-11 shrink-0" aria-label="Tutup pencarian">
            <X aria-hidden="true" />
          </Button>} />
        </div>

        <div className="px-5">

          <label htmlFor="workspace-search" className="mb-2 block text-sm font-medium">Cari halaman, nama, atau NIM</label>

          <Input
            id="workspace-search"
            ref={inputRef}
            value={query}
            onChange={event => { setQuery(event.target.value); setStudents([]); setSearchState("idle"); }}
            onKeyDown={event => {
              if (event.key === "ArrowDown") { event.preventDefault(); resultRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); }
              if (event.key === "Enter" && query.trim()) { event.preventDefault(); if (students[0]) go(`/students?q=${encodeURIComponent(students[0].nim)}`); else if (pages[0]) go(pages[0].href); else if (isStaff) go(`/students?q=${encodeURIComponent(query.trim())}`); }
            }}
            className="h-12 text-base"
            autoComplete="off"
          />
        </div>

        <div
          ref={resultRef}
          className="max-h-[45dvh] overflow-y-auto px-3 pb-3"
          onKeyDown={event => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            const buttons = Array.from(resultRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
            const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
            event.preventDefault();
            if (event.key === "ArrowUp" && index <= 0) inputRef.current?.focus();
            else buttons[Math.min(index + (event.key === "ArrowDown" ? 1 : -1), buttons.length - 1)]?.focus();
          }}
        >

          <p className="px-2 py-2 text-xs font-semibold text-muted-foreground">Halaman dan navigasi</p>

          {pages.map(item => <button
            key={item.href}
            type="button"
            onClick={() => go(item.href)}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base hover:bg-muted focus-visible:bg-muted"
          >
            <item.icon className="size-5 text-primary" aria-hidden="true" />
            {item.label}
            <ArrowRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
          </button>)}

          {isStaff && query.trim().length >= 2 && <>
            <p className="px-2 pt-4 pb-2 text-xs font-semibold text-muted-foreground">Mahasiswa</p>
            <div role="status" className="px-3 text-sm text-muted-foreground">
              {searchState === "loading" ? "Mencari mahasiswa..." : searchState === "error" ? "Pencarian mahasiswa gagal." : students.length === 0 ? "Belum ada hasil mahasiswa." : ""}
            </div>
            {searchState === "error" && <Button variant="outline" onClick={() => setRetry(value => value + 1)} className="m-2 min-h-11">Coba lagi</Button>}
            {students.map(student => <button
              key={student.id}
              type="button"
              onClick={() => go(`/students?q=${encodeURIComponent(student.nim)}`)}
              className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted"
            >
              <Users className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-base font-medium">
                  {student.full_name}
                </span>
                <span className="text-sm text-muted-foreground">NIM {student.nim}</span>
              </span>
            </button>)}
            <button
              type="button"
              onClick={() => go(`/students?q=${encodeURIComponent(query.trim())}`)}
              className="min-h-11 px-3 text-sm font-medium text-ink"
            >Buka pencarian di Mahasiswa</button>
          </>}

          {!query.trim() && <div className="mt-3 border-t border-hairline pt-2">

            <button
              type="button"
              onClick={() => { changeOpen(false); window.location.reload(); }}
              className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-muted"
            ><RefreshCw className="size-5" aria-hidden="true" />Muat ulang halaman</button>

            <button
              type="button"
              onClick={() => go("/changelog")}
              className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-muted"
            ><History className="size-5" aria-hidden="true" />Catatan pembaruan</button>

            <button
              type="button"
              onClick={async () => { changeOpen(false); try { await logout(); router.replace("/login"); } catch { toast.error("Keluar gagal. Coba lagi."); } }}
              className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-destructive hover:bg-muted"
            ><LogOut className="size-5" aria-hidden="true" />Keluar</button>
          </div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
