"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface SaveStateOptions<TArgs extends unknown[]> {
  onSuccess?: (args: TArgs) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useSaveState<TArgs extends unknown[] = []>(
  fn: (...args: TArgs) => Promise<unknown>,
  opts: SaveStateOptions<TArgs> = {},
) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Round 26 audit (P1): track the auto-clear timer so it can be
  // cancelled on unmount AND on the next save() call (otherwise rapid
  // saves interleave their auto-clears and the "saved" badge flickers
  // or sticks visible for too long).
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }
    };
  }, []);

  const save = useCallback(
    async (...args: TArgs) => {
      setIsSaving(true);
      setError(null);
      setIsSaved(false);
      // Cancel any pending auto-clear from a previous save so the new
      // "saved" indicator gets its full 2.5s window.
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }
      try {
        const result = await fn(...args);
        setIsSaved(true);
        if (opts.successMessage) toast.success(opts.successMessage);
        opts.onSuccess?.(args);
        // Auto-clear "saved" indicator after 2.5s.
        savedTimerRef.current = setTimeout(() => {
          setIsSaved(false);
          savedTimerRef.current = null;
        }, 2500);
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        toast.error(opts.errorMessage ?? `Gagal menyimpan: ${msg}`);
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [fn, opts],
  );

  return { isSaving, isSaved, error, save };
}
