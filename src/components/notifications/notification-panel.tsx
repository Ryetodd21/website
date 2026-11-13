"use client";
import { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Brain,
  AlertTriangle,
  Sparkles,
  Users,
  Activity,
  Settings,
  X,
  Inbox,
  Server,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DropdownBackdrop } from "@/components/ui/dropdown-backdrop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSystemStatus, type SystemStatus } from "@/lib/api";

type NotificationKind =
  | "training"
  | "alert"
  | "info"
  | "user"
  | "report"
  | "system"
  | "server";

interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

// Server activity items — populated from GET /api/status on mount
// (always shown, never replaced by user actions).
function buildServerItems(status: SystemStatus | null): Omit<AppNotification, "unread">[] {
  const items: Omit<AppNotification, "unread">[] = [];
  if (status?.server?.version) {
    items.push({
      id: "s1",
      kind: "server",
      title: "Server aktif",
      message: `Versi ${status.server.version} · ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })} WITA`,
      time: "Baru saja",
    });
  }
  if (status?.database?.status === "healthy") {
    items.push({
      id: "s2",
      kind: "server",
      title: "Database terhubung",
      message: "PostgreSQL responsif · Semua operasi berjalan normal",
      time: "Baru saja",
    });
  }
  if (status?.redis?.status === "connected") {
    items.push({
      id: "s3",
      kind: "server",
      title: "Redis terhubung",
      message: "Cache dan antrean berfungsi normal",
      time: "Baru saja",
    });
  }
  if (status?.mqtt_broker?.connected) {
    items.push({
      id: "s4",
      kind: "server",
      title: "Broker MQTT terhubung",
      message: "Real-time log ingestion aktif",
      time: "Baru saja",
    });
  }
  return items;
}

function groupByTime(notifs: AppNotification[]) {
  const today: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  for (const n of notifs) {
    if (n.time.includes("lalu") && !n.time.includes("hari")) today.push(n);
    else earlier.push(n);
  }
  return { today, earlier };
}

// ─── Editorial kind config ───────────────────────────────────────────────
// No tinted fills — just a colored dot matching the status token.

const KIND_DOT: Record<NotificationKind, string> = {
  training: "bg-primary",
  alert:    "bg-destructive",
  info:     "bg-primary",
  user:     "bg-success",
  report:   "bg-warning",
  system:  "bg-ink/40",
  server:   "bg-primary",
};

const KIND_COLOR: Record<NotificationKind, string> = {
  training: "text-primary",
  alert:    "text-destructive",
  info:     "text-primary",
  user:     "text-success",
  report:   "text-warning",
  system:   "text-ink/55",
  server:   "text-ink/65",
};

const KIND_ICON: Record<NotificationKind, typeof Brain> = {
  training: Brain,
  alert:    AlertTriangle,
  info:     Sparkles,
  user:     Users,
  report:   Activity,
  system:   Settings,
  server:   Server,
};

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [serverItems, setServerItems] = useState<Omit<AppNotification, "unread">[]>([]);

  // Fetch real server status on mount to populate server activity section
  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        const status = await getSystemStatus();
        if (cancelled) return;
        const items = buildServerItems(status);
        if (cancelled) return;
        setServerItems(items);
      } catch {
        // silently ignore — server items stay empty
      }
    }
    void fetchStatus();
    return () => { cancelled = true; };
  }, []);

  const unreadCount = items.filter((n) => n.unread).length;
  const { today, earlier } = groupByTime(items);

  const totalUnread = unreadCount + serverItems.length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  function dismiss(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  function renderItem(n: AppNotification, idx: number) {
    const Icon = KIND_ICON[n.kind];
    const isServer = n.kind === "server";

    return (
      <div
        key={n.id}
        className={cn(
          "group relative flex gap-3 px-3 py-3 cursor-pointer border-b divider-soft last:border-0 transition-colors",
          n.unread ? "bg-ink/[0.02]" : "row-hover",
          isServer ? "opacity-85" : "pr-12"
        )}
        style={{
          animation: `notifItemEnter 240ms ease-out both`,
          animationDelay: `${idx * 20}ms`,
        }}
        onClick={() => { if (!isServer) markRead(n.id); }}
      >
        {/* Unread dot */}
        {n.unread && (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        )}

        {/* Icon — editorial dot, no tinted background */}
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center", isServer ? "" : "")}>
          <div className={cn("relative flex h-6 w-6 items-center justify-center rounded-none")}>
            <span className={cn("absolute inset-0 rounded-none opacity-20", KIND_DOT[n.kind])} />
            <Icon className={cn("h-3.5 w-3.5 relative z-10", KIND_COLOR[n.kind])} strokeWidth={1.75} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm leading-tight truncate",
            n.unread ? "font-semibold text-ink" : "text-ink/80"
          )}>
            {n.title}
          </p>
          <p className="text-xs text-ink/55 mt-1 line-clamp-2 leading-snug">
            {n.message}
          </p>
          <p className={cn(
            "eyebrow-sm mt-1.5",
            isServer ? "text-ink/40" : "text-ink/45"
          )}>
            {n.time}
          </p>
        </div>

        {/* Dismiss */}
        {!isServer && (
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={(e) => {
              e.stopPropagation();
              dismiss(n.id);
            }}
            className="absolute right-1 top-1 size-11 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <DropdownBackdrop visible={open} onClose={() => setOpen(false)} />
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifikasi"
            className="relative h-11 w-11 rounded-lg hover:bg-muted transition-colors"
          >
            <Bell className="size-5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
            {totalUnread > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-paper flex items-center justify-center"
                style={{ animation: "notifBadgeIn 240ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                key={totalUnread}
              >
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(420px,calc(100vw-2rem))] p-0 rounded-xl bg-card border border-hairline overflow-hidden z-50 lift-3"
      >
        <div className="flex flex-col max-h-[min(580px,calc(100dvh-10rem))]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b divider-soft">
            <div className="flex items-center gap-3">
              <h3 className="display-sans text-sm text-ink uppercase tracking-wide">Notifikasi</h3>
              {totalUnread > 0 && (
                <span className="eyebrow-sm text-ink inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {totalUnread} baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  aria-label="Tandai semua notifikasi dibaca"
                  className="min-h-11 min-w-11 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-ink transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCheck className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Tandai semua</span>
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="size-11 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                  aria-label="Hapus semua"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Server activity section */}
            <div>
              <div className="px-4 py-2 border-b divider-soft bg-ink/[0.015]">
                <span className="eyebrow-sm text-ink/45">Aktivitas Server</span>
              </div>
              <div>
                {serverItems.map((s, i) => renderItem({ ...s, unread: false }, i))}
              </div>
            </div>

            {/* User notifications */}
            {items.length > 0 && (
              <div>
                <div className="px-4 py-2 border-b divider-soft bg-ink/[0.015]">
                  <span className="eyebrow-sm text-ink/45">Aktivitas User</span>
                </div>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Inbox className="h-8 w-8 text-ink/20 mb-3" />
                    <p className="text-sm text-ink/55">Tidak ada notifikasi</p>
                    <p className="text-xs text-ink/35 mt-1">Anda sudah update dengan semuanya</p>
                  </div>
                ) : (
                  <div>
                    {today.length > 0 && (
                      <div>
                        <div className="px-4 py-2">
                          <span className="eyebrow-sm text-ink/40">Hari Ini</span>
                        </div>
                        <div>
                          {today.map((n, i) => renderItem(n, serverItems.length + i))}
                        </div>
                      </div>
                    )}
                    {earlier.length > 0 && (
                      <div>
                        <div className="px-4 py-2">
                          <span className="eyebrow-sm text-ink/40">Sebelumnya</span>
                        </div>
                        <div>
                          {earlier.map((n, i) => renderItem(n, serverItems.length + today.length + i))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {items.length === 0 && serverItems.length > 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Inbox className="h-7 w-7 text-ink/20 mb-2" />
                <p className="text-xs text-ink/40">Tidak ada notifikasi user</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t divider-soft px-4 py-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-8 text-xs text-ink/55 hover:text-ink transition-colors text-center"
            >
              Tutup panel
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
