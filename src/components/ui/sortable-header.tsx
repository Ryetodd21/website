"use client";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export type SortDir = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentKey?: string;
  currentDir?: SortDir;
  onSort: (key: string) => void;
  align?: "left" | "right";
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  align = "left",
  className,
}: SortableHeaderProps) {
  const active = currentKey === sortKey && currentDir != null;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "group inline-flex items-center gap-1 eyebrow-sm text-ink/55 hover:text-ink transition-colors",
        active && "text-ink",
        align === "right" && "justify-end w-full",
        className,
      )}
    >
      {label}
      {active && currentDir === "asc" ? (
        <ChevronUp className="h-3 w-3" strokeWidth={1.5} />
      ) : active && currentDir === "desc" ? (
        <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
      ) : (
        <span className="inline-flex flex-col h-3 w-3 opacity-30 group-hover:opacity-60">
          <ChevronUp className="h-1.5 w-3 -mb-0.5" strokeWidth={1.5} />
          <ChevronDown className="h-1.5 w-3" strokeWidth={1.5} />
        </span>
      )}
    </button>
  );
}

export function useSort<T>(
  initialKey?: string,
  initialDir: SortDir = "asc",
) {
  const [key, setKey] = useState<string | undefined>(initialKey);
  const [dir, setDir] = useState<SortDir>(initialDir);

  const toggle = useCallback((newKey: string) => {
    if (newKey === key) {
      if (dir === "asc") setDir("desc");
      else if (dir === "desc") {
        setKey(undefined);
        setDir(null);
      } else setDir("asc");
    } else {
      setKey(newKey);
      setDir("asc");
    }
  }, [key, dir]);

  const sorted = useCallback((items: T[]): T[] => {
    if (!key || !dir) return items;
    return [...items].sort((a, b) => {
      const av = (a as Record<string, unknown>)[key];
      const bv = (b as Record<string, unknown>)[key];
      if (av == null && bv == null) return 0;
      if (av == null) return dir === "asc" ? 1 : -1;
      if (bv == null) return dir === "asc" ? -1 : 1;
      if (typeof av === "number" && typeof bv === "number") {
        return dir === "asc" ? av - bv : bv - av;
      }
      return dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [key, dir]);

  return { key, dir, toggle, sorted };
}