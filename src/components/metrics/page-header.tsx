import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadButton, type DownloadColumn } from "@/components/ui/download-button";
import { StatusBadge, type StatusType } from "./section";
import { getCurrentUser } from "@/lib/api";

// ─── Editorial Page Header ──────────────────────────────────────────────
// Replaces the previous glass + badge header. Layout:
//
//   eyebrow caps  ·  status dot   [right slot: actions]
//   display serif title
//   body subtitle
//   hairline rule under everything

export function PageHeader({
  title,
  subtitle,
  connected,
  statusBadge,
  rightActions,
  showDate = true,
  downloadData,
  downloadColumns,
  downloadFilename,
  downloadLabel = "Unduh",
  downloadTitle,
  downloadInstitution,
  number,
}: {
  title: string;
  subtitle?: string;
  connected?: boolean;
  statusBadge?: { type: StatusType; label: string };
  rightActions?: ReactNode;
  showDate?: boolean;
  downloadData?: Record<string, unknown>[];
  downloadColumns?: DownloadColumn[];
  downloadFilename?: string;
  downloadLabel?: string;
  downloadTitle?: string;
  downloadInstitution?: { name: string; faculty?: string; program?: string };
  /** Optional eyebrow number prefix, e.g. "01" */
  number?: string;
}) {
  const [downloader, setDownloader] = useState<{ name: string; role: string; email?: string; nip?: string } | undefined>(undefined);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setDownloader({ name: u.full_name ?? u.sub, role: u.role, email: u.email, nip: u.nip });
    });
  }, []);

  const today = new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Makassar",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const showDownloadButton =
    !!downloadData && !!downloadColumns && !!downloadFilename && downloadData.length > 0;

  return (
    <header className="mb-6">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4 sm:pb-5">
        <div className="min-w-0 flex-1">
          {/* Eyebrow row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 sm:mb-2.5">
            {number && (
              <span className="eyebrow-sm tabular-nums text-ink">{number}</span>
            )}
            <span className="text-sm text-muted-foreground">
              {showDate ? today : "Monitor UNG"}
            </span>
            {connected !== undefined && (
              <StatusBadge
                type={connected ? "active" : "warning"}
                label={connected ? "Pembaruan langsung terhubung" : "Pembaruan langsung terputus"}
              />
            )}
            {statusBadge && <StatusBadge type={statusBadge.type} label={statusBadge.label} />}
          </div>

          {/* Display title */}
          <h1 className="display-sans text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight break-words">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-base text-muted-foreground mt-2 leading-relaxed max-w-prose">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right actions */}
        <div className="flex max-w-full flex-wrap items-center gap-2 xl:shrink-0">
          {rightActions ?? (
            <>
              {showDownloadButton ? (
                <DownloadButton
                  filename={downloadFilename!}
                  data={downloadData!}
                  columns={downloadColumns!}
                  label={downloadLabel}
                  title={downloadTitle ?? title}
                  institution={downloadInstitution}
                  downloadedBy={downloader}
                />
              ) : (
                <Button
                  variant="outline"
                  disabled
                  title="Belum ada data untuk diunduh"
                  className="min-h-11 gap-2 rounded-lg text-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export { Loader2 };
