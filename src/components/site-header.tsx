import Link from "next/link";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/certificates", label: "Verify" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="relative z-30 w-full">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-5 sm:px-8">
        <Wordmark />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.95rem] font-medium text-foreground/80 transition-colors duration-150 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-[0.95rem] font-medium text-foreground/80 transition-colors duration-150 hover:text-foreground sm:block"
              >
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-[0.95rem] font-medium text-foreground/80 transition-colors duration-150 hover:text-foreground sm:block"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-primary px-4 py-2.5 text-[0.95rem] font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
