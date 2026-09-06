import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 sm:px-12">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5 text-primary" aria-hidden />
          <span>Capacity Connect</span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Solid navy panel — no gradients. */}
      <div className="hidden flex-col justify-end bg-navy p-12 text-slate-200 lg:flex">
        <blockquote className="max-w-md">
          <p className="text-2xl font-medium leading-snug text-white">
            Reading time here counts attention, not tab-open time.
          </p>
          <footer className="mt-4 text-sm text-slate-400">
            Switch tabs and the clock stops. Every chapter you finish teaches the
            recommender what to show you next.
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
