"use client";
import React from "react";
import { useAcademicFilter } from "@/lib/academic-filter";
import { Lock } from "lucide-react";

export function AcademicFilterBar() {
  const {
    jurusanList,
    selectedJurusanId,
    selectedProdiId,
    isJurusanLocked,
    dosenJurusanName,
    setJurusanId,
    setProdiId,
    availableProdis,
  } = useAcademicFilter();

  if (jurusanList.length === 0 && !isJurusanLocked) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      {/* Jurusan dropdown / locked badge */}
      {isJurusanLocked ? (
        <div
          title="Tampilan dibatasi pada jurusan Anda"
          className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded border border-hairline bg-muted/60 px-2.5 text-xs font-medium text-ink sm:flex-none"
        >
          <Lock className="size-3 text-ink/60" aria-hidden="true" />
          <span className="max-w-[140px] truncate sm:max-w-[180px]">
            {dosenJurusanName || "Jurusan Dosen"}
          </span>
        </div>
      ) : (
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            aria-label="Filter Jurusan"
            value={selectedJurusanId}
            onChange={(e) => setJurusanId(e.target.value)}
            className="editorial-input h-8 w-full truncate py-1 pl-2.5 pr-6 text-xs sm:max-w-[170px]"
          >
            <option value="all">Semua Jurusan</option>
            {jurusanList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Program Studi dropdown */}
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <select
          aria-label="Filter Program Studi"
          value={selectedProdiId}
          onChange={(e) => setProdiId(e.target.value)}
          className="editorial-input h-8 w-full truncate py-1 pl-2.5 pr-6 text-xs sm:max-w-[170px]"
        >
          <option value="all">Semua Prodi</option>
          {availableProdis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
