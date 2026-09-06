import Link from "next/link";

import { Wordmark } from "@/components/wordmark";

const LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/certificates", label: "Verify a certificate" },
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create an account" },
];

export function SiteFooter() {
  return (
    <footer className="bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t px-5 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm font-medium text-muted-foreground">
            Read deeply. Finish completely.
          </p>
        </div>

        <nav className="flex flex-col gap-2.5 sm:items-end">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
