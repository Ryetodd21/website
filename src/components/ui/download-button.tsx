"use client";
import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export interface DownloadColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  format?: (value: unknown, row: T) => string | number;
}

export type DownloadFormat = "csv" | "excel" | "json" | "pdf";

interface DownloadButtonProps<T = Record<string, unknown>> {
  filename: string;
  data: T[];
  columns: DownloadColumn<T>[];
  formats?: DownloadFormat[];
  label?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  showChevron?: boolean;
  title?: string;
  emptyMessage?: string;
  /** Info tentang siapa yang mengunduh */
  downloadedBy?: {
    name: string;
    role: string;
    email?: string;
    nip?: string;
  };
  /** Info institusi untuk header laporan */
  institution?: {
    name: string;
    faculty?: string;
    program?: string;
  };
}

function triggerDownload(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  const str = typeof value === "string" && /^[\s\u0000-\u001f]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function rowsToCsv<T>(data: T[], columns: DownloadColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = data
    .map((row) =>
      columns
        .map((col) => {
          const raw = (row as Record<string, unknown>)[col.key];
          const val = col.format ? col.format(raw, row) : raw;
          return escapeCsvCell(val);
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

function rowsToHtml<T>(data: T[], columns: DownloadColumn<T>[], options: {
  title: string;
  institution?: { name: string; faculty?: string; program?: string };
  downloadedBy?: { name: string; role: string; email?: string; nip?: string };
}): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateTimeGenerated = `${dateStr} pukul ${hh}:${mm} WITA`;

  // Check if data has section column for grouping
  const hasSection = columns.some(c => c.key === "section");
  const sectionIdx = columns.findIndex(c => c.key === "section");

  // Build table header
  const thead = columns.map((c) =>
    `<th style="border:1px solid #9f0712;padding:7px 10px;background:#9f0712;color:#fff;font-weight:700;text-align:center;font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.3px;text-transform:uppercase;white-space:nowrap">${escapeHtml(c.label)}</th>`
  ).join("");

  // Build table body with section grouping
  let rows = "";
  let lastSection = "";
  data.forEach((row, idx) => {
    const sectionVal = hasSection ? String((row as Record<string, unknown>)[columns[sectionIdx].key] ?? "") : "";
    if (hasSection && sectionVal && sectionVal !== lastSection) {
      const sectionBg = "#fef2f2";
      const sectionLabel = sectionVal;
      rows += `<tr><td colspan="${columns.length}" style="border:1px solid #9f0712;padding:6px 12px;background:${sectionBg};color:#000;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px">${escapeHtml(sectionLabel)}</td></tr>`;
      lastSection = sectionVal;
    }
    const cells = columns.map((col) => {
      const raw = (row as Record<string, unknown>)[col.key];
      const val = col.format ? col.format(raw, row) : raw;
      return `<td style="border:1px solid #9f0712;padding:6px 10px;font-family:system-ui,sans-serif;font-size:10px;color:#1e293b;text-align:center;vertical-align:middle">${escapeHtml(String(val ?? "—"))}</td>`;
    }).join("");
    const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    rows += `<tr style="background:${bg}">${cells}</tr>`;
  });

  // Institution header — centered
  const instHtml = options.institution ? `
    <div style="text-align:center;margin-bottom:2px">
      <div style="font-family:system-ui,sans-serif;font-size:14px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.8px">${escapeHtml(options.institution.name)}</div>
    </div>
    ${options.institution.faculty ? `<div style="text-align:center;font-family:system-ui,sans-serif;font-size:11px;color:#475569;margin-top:1px">${escapeHtml(options.institution.faculty)}</div>` : ""}
    ${options.institution.program ? `<div style="text-align:center;font-family:system-ui,sans-serif;font-size:11px;color:#475569;margin-top:1px">${escapeHtml(options.institution.program)}</div>` : ""}
  ` : `<div style="text-align:center;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.8px">Sistem Monitoring Distraksi</div>`;

  // Downloader profile — left aligned below institution
  const downloaderHtml = options.downloadedBy ? `
    <table style="border-collapse:collapse;margin-top:8px;width:auto">
      <tr>
        <td style="padding:1px 8px 1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#64748b;text-align:left;white-space:nowrap;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;vertical-align:top">Diunduh oleh</td>
        <td style="padding:1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#1e293b;text-align:left;font-weight:600">${escapeHtml(options.downloadedBy.name)}</td>
      </tr>
      <tr>
        <td style="padding:1px 8px 1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#64748b;text-align:left;white-space:nowrap;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;vertical-align:top">Peran</td>
        <td style="padding:1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#1e293b;text-align:left;text-transform:capitalize">${escapeHtml(options.downloadedBy.role)}</td>
      </tr>
      ${options.downloadedBy.nip ? `
      <tr>
        <td style="padding:1px 8px 1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#64748b;text-align:left;white-space:nowrap;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;vertical-align:top">NIP / NIM</td>
        <td style="padding:1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#1e293b;text-align:left">${escapeHtml(options.downloadedBy.nip)}</td>
      </tr>` : ""}
      ${options.downloadedBy.email ? `
      <tr>
        <td style="padding:1px 8px 1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#64748b;text-align:left;white-space:nowrap;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;vertical-align:top">Email</td>
        <td style="padding:1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#1e293b;text-align:left">${escapeHtml(options.downloadedBy.email)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:1px 8px 1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#64748b;text-align:left;white-space:nowrap;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;vertical-align:top">Waktu</td>
        <td style="padding:1px 0;font-family:system-ui,sans-serif;font-size:10px;color:#1e293b;text-align:left">${dateTimeGenerated}</td>
      </tr>
    </table>
  ` : "";

  const logoText = options.institution?.name ?? "Monitor UNG";
  const uniqueSections = hasSection ? [...new Set(data.map(r => String((r as Record<string, unknown>)[columns[sectionIdx].key] ?? "")))].filter(Boolean) : [];

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title>
<style>
@page{size:A4 portrait;margin:2cm 2cm 1.8cm 2cm}
body{font-family:system-ui,sans-serif;color:#18181b;margin:0;padding:0;background:#fff}
.report-header{border-bottom:2px solid #9f0712;padding-bottom:12px;margin-bottom:14px}
.report-title{margin:12px 0 4px;font-size:15px;font-weight:800;color:#0f172a;text-align:center;letter-spacing:-0.2px}
.report-subtitle{font-size:10px;color:#64748b;text-align:center;margin:0}
table{border-collapse:collapse;width:100%;margin-top:12px}
.report-footer{margin-top:14px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3px}
.signature-section{margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end}
.signature-left{font-family:system-ui,sans-serif;font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.4px}
.signature-right{text-align:center;font-family:system-ui,sans-serif;min-width:160px}
.signature-right .line{font-size:10px;color:#64748b;margin-bottom:28px}
.signature-right .name{font-size:11px;color:#1e293b;font-weight:700}
.signature-right .role{font-size:9px;color:#64748b;text-transform:capitalize}
.section-summary{margin-top:8px;font-size:9px;color:#64748b;text-align:center}
</style>
</head><body>
<div class="report-header">
  ${instHtml}
  ${downloaderHtml}
  <h1 class="report-title">${escapeHtml(options.title)}</h1>
  <p class="report-subtitle">${data.length} data &middot; ${dateTimeGenerated}</p>
  ${uniqueSections.length > 0 ? `<p class="section-summary">${uniqueSections.length} kategori &middot; ${uniqueSections.map(escapeHtml).join(" &middot; ")}</p>` : ""}
</div>
<table>
  <thead><tr>${thead}</tr></thead>
  <tbody>${rows}</tbody>
</table>
${options.downloadedBy ? `
<div class="signature-section">
  <div class="signature-left">${escapeHtml(logoText)} &middot; ${dateStr}</div>
  <div class="signature-right">
    <div class="line">Hormat kami,</div>
    <div class="name">${escapeHtml(options.downloadedBy.name)}</div>
    <div class="role">${escapeHtml(options.downloadedBy.role)}</div>
  </div>
</div>` : ""}
<div class="report-footer">
  <span>Dokumen ini digenerate secara otomatis oleh Sistem Monitoring Distraksi Mahasiswa &middot; ${escapeHtml(logoText)}</span>
  <span>Hal 1 / 1</span>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]!));
}

export function DownloadButton<T = Record<string, unknown>>({
  filename,
  data,
  columns,
  formats = ["csv", "excel", "json", "pdf"],
  label = "Unduh",
  variant = "outline",
  size = "sm",
  // Editorial default: hairline border, square corners (rounded-none), no glass.
  // Caller can override via className prop for finer control per location.
  className = "h-8 gap-1.5 text-xs rounded-none border-hairline bg-transparent hover:border-ink hover:bg-transparent",
  showChevron = true,
  title,
  emptyMessage = "Tidak ada data untuk diunduh",
  downloadedBy,
  institution,
}: DownloadButtonProps<T>) {
  const [open, setOpen] = useState(false);

  function handleDownload(format: DownloadFormat) {
    if (!data || data.length === 0) {
      toast.error(emptyMessage);
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const baseName = `${filename}-${stamp}`;

    if (format === "csv") {
      triggerDownload(rowsToCsv(data, columns), `${baseName}.csv`, "text/csv;charset=utf-8;");
      toast.success(`CSV diunduh · ${data.length} baris`);
    } else if (format === "excel") {
      // Excel opens UTF-8 CSV with BOM
      const csv = "﻿" + rowsToCsv(data, columns);
      triggerDownload(csv, `${baseName}.xls`, "application/vnd.ms-excel;charset=utf-8;");
      toast.success(`Excel diunduh · ${data.length} baris`);
    } else if (format === "json") {
      const json = JSON.stringify(data, null, 2);
      triggerDownload(json, `${baseName}.json`, "application/json;charset=utf-8;");
      toast.success(`JSON diunduh · ${data.length} baris`);
    } else if (format === "pdf") {
      const html = rowsToHtml(data, columns, {
        title: title ?? filename,
        institution,
        downloadedBy,
      });
      const w = window.open("", "_blank");
      if (!w) {
        toast.error("Pop-up diblokir · izinkan pop-up untuk cetak PDF");
        return;
      }
      w.document.write(html);
      w.document.close();
      w.addEventListener("load", () => {
        setTimeout(() => w.print(), 200);
      });
      setTimeout(() => {
        try { w.focus(); } catch {}
      }, 100);
      toast.success(`PDF siap dicetak · ${data.length} baris`);
    }

    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* Blur backdrop for visual layering only — click-outside closing is
          handled natively by Radix DropdownMenu. This avoids the auto-close
          bug where the backdrop intercepted clicks before the menu handler
          fired (visible especially in detail rows where the table is dense). */}
      {open && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-2xl pointer-events-none"
          style={{ animation: "notifBackdropIn 240ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          aria-hidden
        />
      )}
      <DropdownMenuTrigger
        render={
          <Button variant={variant} size={size} className={className}>
            <Download className="h-3.5 w-3.5" />
            {label}
            {showChevron && <ChevronDown className="h-3 w-3 opacity-60" />}
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="!w-72 p-0 bg-paper border border-hairline overflow-hidden z-50"
      >
        {/* Header — eyebrow style, matches the rest of the dashboard */}
        <div className="px-4 py-3 border-b border-hairline">
          <p className="eyebrow-sm text-ink/55">Unduh Laporan</p>
          <p className="text-sm text-ink font-semibold mt-0.5">Pilih format file</p>
        </div>

        {/* Numbered editorial rows — paper bg, hairline dividers, no rounded
            corners, no coloured icon wells. Hover: ink/5 tint. Click anywhere
            on the row triggers the download. */}
        <div className="divide-y divide-hairline">
          {formats.map((format, i) => (
            <button
              key={format}
              type="button"
              onClick={() => handleDownload(format)}
              className="group flex items-start gap-3 w-full text-left px-4 py-3 cursor-pointer hover:bg-ink/[0.03] focus:bg-ink/[0.03] focus:outline-none transition-colors"
            >
              <span className="eyebrow-sm tabular-nums text-ink shrink-0 mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink leading-tight">{FORMAT_META[format].title}</p>
                <p className="text-xs text-ink/55 mt-0.5 leading-snug">
                  {FORMAT_META[format].desc}
                </p>
              </div>
              <Download
                className="h-3.5 w-3.5 text-ink/40 mt-0.5 shrink-0 transition-transform group-hover:translate-y-0.5"
                strokeWidth={1.75}
              />
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Editorial copy per format. Kept here so the dropdown JSX stays compact.
const FORMAT_META: Record<DownloadFormat, { title: string; desc: string }> = {
  csv: { title: "CSV", desc: "Comma-separated values · Spreadsheet ringan" },
  excel: { title: "Excel", desc: "Microsoft Excel (.xls)" },
  json: { title: "JSON", desc: "Structured data · Format API" },
  pdf: { title: "PDF / Cetak", desc: "Cetak laporan via browser" },
};
