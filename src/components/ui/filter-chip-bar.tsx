"use client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface FilterChip {
  id: string;
  label: string;
  /** Optional Okabe-Ito accent dot color (CSS oklch literal or token). */
  accent?: string;
}

interface FilterChipBarProps {
  label: string;
  chips: FilterChip[];
  active: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  className?: string;
}

export function FilterChipBar({
  label,
  chips,
  active,
  onToggle,
  onClear,
  className,
}: FilterChipBarProps) {
  const hasActive = active.length > 0;
  return (
    <div className={cn("flex items-baseline gap-2 flex-wrap", className)}>
      <span className="eyebrow-sm text-ink/45 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {chips.map((chip) => {
          const on = active.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onToggle(chip.id)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 border text-sm font-medium transition-colors",
                on
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-hairline bg-card text-muted-foreground hover:border-primary hover:text-ink",
              )}
              aria-pressed={on}
            >
              {chip.accent && (
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: chip.accent }}
                />
              )}
              {chip.label}
              {on && <X className="size-4" aria-hidden="true" />}
            </button>
          );
        })}
        {hasActive && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 rounded-lg px-3 text-sm text-muted-foreground hover:text-ink underline-offset-2 hover:underline"
          >
            Bersihkan
          </button>
        )}
      </div>
    </div>
  );
}
