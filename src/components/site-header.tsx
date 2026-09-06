import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5 text-primary" aria-hidden />
          <span>Capacity Connect</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/courses"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Courses
          </Link>
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
