import type { ReactNode } from "react";
import { AlertCircle, ChartNoAxesCombined, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export function DataState({ pending, error, empty, onRetry, children }: {
  pending?: boolean;
  error?: string | null;
  empty?: string | false;
  onRetry: () => void;
  children?: ReactNode;
}) {
  if (pending) return <div role="status" aria-label="Memuat data" className="space-y-4 p-5">
    <Skeleton height={24} width="45%" aria-hidden="true" />
    <Skeleton height={200} aria-hidden="true" />
    <span className="sr-only">Memuat data...</span>
  </div>;
  if (error) return <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
    <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
    <p className="font-semibold text-ink">Data gagal dimuat</p>
    <p className="max-w-prose break-words text-sm text-muted-foreground">
      {error}
    </p>
    <Button variant="outline" onClick={onRetry} className="min-h-11 gap-2"><RefreshCw className="size-4" aria-hidden="true" />Coba lagi</Button>
  </div>;
  if (empty) return <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
    <ChartNoAxesCombined className="size-8 text-muted-foreground" aria-hidden="true" />
    <p className="font-medium text-ink">Belum ada data</p>
    <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
      {empty}
    </p>
  </div>;
  return children;
}
