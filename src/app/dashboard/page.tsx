import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Defence in depth: middleware already gates /dashboard, but a page that
  // reads user data must never rely on the matcher alone.
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {session.user.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your courses, reading time and certificates land here in M6.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
