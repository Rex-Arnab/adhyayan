import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-24 text-center sm:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">
          That page does not exist
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          The link may be out of date, or the course may have been renamed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/courses"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
          >
            Browse courses
          </Link>
          <Link
            href="/"
            className="rounded-xl border bg-card px-5 py-2.5 text-sm font-semibold transition-colors duration-150 hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
