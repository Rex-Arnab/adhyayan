import { SiteHeader } from "@/components/site-header";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <PageHeaderSkeleton />
        <Skeleton className="mt-8 h-9 w-full max-w-sm rounded-xl" />
        <div className="mt-4 flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <CardGridSkeleton />
      </main>
    </div>
  );
}
