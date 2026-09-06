import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VerifyForm } from "@/components/verify-form";

export const metadata: Metadata = { title: "Verify a certificate" };

export default function VerifyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-20 sm:px-8">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em]">
          Verify a certificate
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Enter the serial printed on the document, or scan its QR code.
        </p>
        <VerifyForm />
      </main>
      <SiteFooter />
    </div>
  );
}
