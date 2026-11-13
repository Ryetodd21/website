"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{ keys: string[]; label: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigasi",
    shortcuts: [
      { keys: ["G", "D"], label: "Dashboard" },
      { keys: ["G", "M"], label: "Mahasiswa" },
      { keys: ["G", "R"], label: "Laporan" },
      { keys: ["G", "L"], label: "Log Aktivitas" },
      { keys: ["G", "A"], label: "AI Analisis" },
      { keys: ["G", "K"], label: "Akademik" },
    ],
  },
  {
    title: "Aksi",
    shortcuts: [
      { keys: ["?"], label: "Bantuan pintasan ini" },
      { keys: ["R"], label: "Muat ulang data" },
      { keys: ["Esc"], label: "Tutup dialog atau panel" },
    ],
  },
  {
    title: "Perintah",
    shortcuts: [
      { keys: ["Cmd", "K"], label: "Buka command palette" },
    ],
  },
];

function KbdKey({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 border border-hairline font-mono text-[10px] text-ink/65 bg-ink/[0.025] min-w-[1.5rem] text-center">
      {label}
    </kbd>
  );
}

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "?" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName ?? "",
        )
      ) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg rounded-none bg-paper p-0 border-hairline">
        <DialogTitle className="px-5 py-4 border-b border-hairline">Pintasan keyboard</DialogTitle>
        {/* Groups */}
        <div className="divide-y divide-hairline">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="px-5 py-4 first:pt-5 last:pb-5">
              <p className="eyebrow text-ink/45 mb-3">{group.title}</p>
              <div className="space-y-2">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-ink">{s.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, i) => (
                        <span key={k} className="contents">
                          <KbdKey label={k} />
                          {i < s.keys.length - 1 && (
                            <span className="text-ink/35 text-[10px] mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
