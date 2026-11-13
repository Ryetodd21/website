"use client";
import { useCallback, useEffect, useState } from "react";

export function useApiResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ data: T | null; pending: boolean; error: string | null }>({
    data: null, pending: true, error: null,
  });
  const reload = useCallback(() => setVersion(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    async function run() {
      setState(previous => ({ ...previous, pending: true, error: null }));
      try {
        const data = await load(controller.signal);
        if (!controller.signal.aborted) setState({ data, pending: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ data: null, pending: false, error: error instanceof Error ? error.message : "Data gagal dimuat." });
        }
      }
    }
    void run();
    return () => controller.abort();
  }, [load, version]);

  return { ...state, reload };
}
