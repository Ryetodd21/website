"use client";
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { getJurusan, getProgramStudi, setAcademicScopeHeaders, Jurusan, ProgramStudi } from "@/lib/api";
import { useUserProfile } from "@/lib/user-profile";

interface AcademicFilterContextType {
  jurusanList: Jurusan[];
  prodiList: ProgramStudi[];
  selectedJurusanId: string;
  selectedProdiId: string;
  isJurusanLocked: boolean;
  dosenJurusanName: string | null;
  setJurusanId: (id: string) => void;
  setProdiId: (id: string) => void;
  availableProdis: ProgramStudi[];
}

const AcademicFilterContext = createContext<AcademicFilterContextType>({
  jurusanList: [],
  prodiList: [],
  selectedJurusanId: "all",
  selectedProdiId: "all",
  isJurusanLocked: false,
  dosenJurusanName: null,
  setJurusanId: () => {},
  setProdiId: () => {},
  availableProdis: [],
});

export function AcademicFilterProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile();
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [selectedJurusanId, setSelectedJurusanState] = useState<string>("all");
  const [selectedProdiId, setSelectedProdiState] = useState<string>("all");

  const isDosen = profile.role.toLowerCase().trim() === "dosen";

  // Load master jurusans and prodis once on mount
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [jList, pList] = await Promise.all([
          getJurusan({ includeInactive: false }),
          getProgramStudi({ includeInactive: false }),
        ]);
        if (!cancelled) {
          setJurusanList(jList);
          setProdiList(pList);
        }
      } catch {
        // ignore load errors
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // For Dosen: identify matching Jurusan from profile and lock it
  const dosenMatch = useMemo(() => {
    if (!isDosen || jurusanList.length === 0) return null;
    const aff = (profile.studyProgram || "").trim().toLowerCase();
    if (!aff) return null;

    // Direct match against Jurusan
    const matchedJurusan = jurusanList.find(
      (j) =>
        j.id.toLowerCase() === aff ||
        j.code.toLowerCase() === aff ||
        j.name.toLowerCase() === aff ||
        aff.includes(j.name.toLowerCase()) ||
        j.name.toLowerCase().includes(aff)
    );
    if (matchedJurusan) return matchedJurusan;

    // Or match via ProgramStudi under a Jurusan
    const matchedProdi = prodiList.find(
      (p) =>
        p.id.toLowerCase() === aff ||
        p.code.toLowerCase() === aff ||
        p.name.toLowerCase() === aff ||
        aff.includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(aff)
    );
    if (matchedProdi && matchedProdi.jurusan_id) {
      return jurusanList.find((j) => j.id === matchedProdi.jurusan_id) ?? null;
    }

    return null;
  }, [isDosen, jurusanList, prodiList, profile.studyProgram]);

  useEffect(() => {
    if (isDosen && dosenMatch) {
      setSelectedJurusanState(dosenMatch.id);
      setAcademicScopeHeaders(dosenMatch.id, selectedProdiId);
      // Header dipasang setelah fetch pertama. Tanpa event, halaman dosen
      // tetap menampilkan seluruh kampus sampai prodi diganti.
      window.dispatchEvent(new CustomEvent("academic-filter-changed", {
        detail: { jurusanId: dosenMatch.id, prodiId: selectedProdiId },
      }));
    }
  }, [isDosen, dosenMatch, selectedProdiId]);

  const setJurusanId = useCallback((id: string) => {
    if (isDosen) return; // Locked for dosen
    setSelectedJurusanState(id);
    setSelectedProdiState("all");
    setAcademicScopeHeaders(id, "all");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("academic-filter-changed", { detail: { jurusanId: id, prodiId: "all" } }));
    }
  }, [isDosen]);

  const setProdiId = useCallback((id: string) => {
    setSelectedProdiState(id);
    setAcademicScopeHeaders(selectedJurusanId, id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("academic-filter-changed", { detail: { jurusanId: selectedJurusanId, prodiId: id } }));
    }
  }, [selectedJurusanId]);

  const availableProdis = useMemo(() => {
    if (selectedJurusanId === "all") return prodiList;
    return prodiList.filter((p) => p.jurusan_id === selectedJurusanId);
  }, [prodiList, selectedJurusanId]);

  return (
    <AcademicFilterContext.Provider
      value={{
        jurusanList,
        prodiList,
        selectedJurusanId,
        selectedProdiId,
        isJurusanLocked: isDosen,
        dosenJurusanName: dosenMatch?.name ?? (isDosen ? profile.studyProgram || "Jurusan Dosen" : null),
        setJurusanId,
        setProdiId,
        availableProdis,
      }}
    >
      {children}
    </AcademicFilterContext.Provider>
  );
}

export function useAcademicFilter() {
  return useContext(AcademicFilterContext);
}

/** Live events carry program_studi_id. Missing field stays visible (old publisher). */
export function eventInAcademicScope(
  event: { program_studi_id?: string | null },
  selectedJurusanId: string,
  selectedProdiId: string,
  prodiList: { id: string; jurusan_id?: string | null }[],
): boolean {
  if (selectedJurusanId === "all" && selectedProdiId === "all") return true;
  const id = event.program_studi_id;
  if (!id) return true;
  if (selectedProdiId !== "all") return id === selectedProdiId;
  return prodiList.some((p) => p.id === id && p.jurusan_id === selectedJurusanId);
}
