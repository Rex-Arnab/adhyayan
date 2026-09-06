import { SiteHeader } from "@/components/site-header";
import { ReadingSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        <aside className="hidden w-[19rem] shrink-0 border-r p-4 lg:block">
          <div className="flex items-start gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </aside>
        <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <ReadingSkeleton />
        </main>
      </div>
    </div>
  );
}
