import Link from "next/link";
import { BookOpen, LineChart, Award } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  {
    icon: BookOpen,
    title: "Enrol and read",
    body: "Short, text-first chapters you can finish in a sitting. No videos to sit through.",
  },
  {
    icon: LineChart,
    title: "We measure attention",
    body: "Reading time counts only while you are actually on the page and active — switch tabs and it stops.",
  },
  {
    icon: Award,
    title: "Finish and verify",
    body: "Complete every chapter to earn a certificate with a public verification link.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Learn something small, completely.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Short written courses that track how you actually read — so we can tell
            you what to learn next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className={buttonVariants({ size: "lg" })}>
              Browse courses
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Create an account
            </Link>
          </div>
        </section>

        <section className="border-t bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border bg-card p-6 shadow-sm">
                <Icon className="size-5 text-primary" aria-hidden />
                <h2 className="mt-4 font-medium">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
