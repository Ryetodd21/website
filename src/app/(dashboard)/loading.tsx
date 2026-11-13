import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Memuat halaman" className="space-y-6">
      <div aria-hidden="true" className="space-y-3">
        <Skeleton height={32} width="65%" />
        <Skeleton height={20} width="85%" />
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map(item => (
          <div key={item} className="dashboard-panel space-y-5 p-6">
            <Skeleton height={24} width="45%" />
            <Skeleton height={200} />
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Menyiapkan halaman...</p>
    </div>
  );
}
