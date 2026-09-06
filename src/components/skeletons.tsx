import { Skeleton } from "@/components/ui/skeleton";

/** Shapes deliberately mirror the real content so nothing jumps on load. */

export function CourseCardSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-6">
      <Skeleton className="size-14 rounded-2xl" />
      <Skeleton className="mt-5 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-5 flex gap-1.5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-4 w-40" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-32 rounded-3xl" />
      ))}
    </div>
  );
}

export function ReadingSkeleton() {
  return (
    <div className="reading-column mx-auto">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-10 w-4/5" />
      {[...Array(9)].map((_, i) => (
        <Skeleton key={i} className={`mt-4 h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
      ))}
      <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <>
      <Skeleton className="h-12 w-64" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
    </>
  );
}
