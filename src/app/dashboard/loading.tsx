import { SiteHeader } from "@/components/site-header";
import { PageHeaderSkeleton, StatRowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <PageHeaderSkeleton />
        <StatRowSkeleton />
        <Skeleton className="mt-14 h-8 w-56" />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="mt-14 h-8 w-56" />
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
