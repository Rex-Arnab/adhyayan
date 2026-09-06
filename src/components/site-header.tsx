import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap"
        >
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

          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Dashboard
              </Link>
              <ThemeToggle />
              <SignOutButton />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/login" className={buttonVariants({ size: "sm" })}>
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
