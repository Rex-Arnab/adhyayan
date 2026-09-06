import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Download, XCircle } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCertificateBySerial } from "@/lib/certificate";
import { formatMinutes } from "@/lib/reading";

type Params = { params: Promise<{ serial: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { serial } = await params;
  const certificate = await getCertificateBySerial(serial);
  return certificate
    ? {
        title: `Certificate ${certificate.serial}`,
        description: `${certificate.learnerName} completed ${certificate.courseTitle}.`,
      }
    : { title: "Certificate not found" };
}

/** Public by design: anyone holding the serial can verify it. That is the point. */
export default async function CertificatePage({ params }: Params) {
  const { serial } = await params;
  const certificate = await getCertificateBySerial(serial);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-8">
        {!certificate ? (
          <div className="rounded-3xl border border-dashed p-12 text-center">
            <XCircle className="mx-auto size-10 text-locked" aria-hidden />
            <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">
              No certificate with that serial
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              We could not find a certificate matching{" "}
              <span className="font-mono font-semibold">{serial}</span>. Check the
              code on the document and try again.
            </p>
            <Link
              href="/courses"
              className="mt-7 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-success">
              <BadgeCheck className="size-5" aria-hidden />
              <p className="text-sm font-bold uppercase tracking-[0.16em]">
                Valid certificate
              </p>
            </div>

            <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              {certificate.learnerName}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              completed{" "}
              <span className="font-bold text-foreground">
                {certificate.courseTitle}
              </span>{" "}
              on{" "}
              {certificate.issuedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </p>

            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              <Fact label="Serial" value={certificate.serial} mono />
              <Fact
                label="Reading time"
                value={formatMinutes(
                  Math.round(
                    certificate.enrollment.chapters.reduce(
                      (s, c) => s + c.activeSeconds,
                      0,
                    ) / 60,
                  ),
                )}
              />
              <Fact label="Downloads" value={String(certificate.downloads)} />
            </dl>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={`/api/certificates/${certificate.serial}/pdf`}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
              >
                <Download className="size-4" aria-hidden />
                Download PDF
              </a>
              <Link
                href={`/courses/${certificate.enrollment.course.slug}`}
                className="inline-flex items-center rounded-2xl border bg-card px-6 py-3 text-base font-semibold transition-colors duration-150 hover:bg-muted"
              >
                View the course
              </Link>
            </div>

            <p className="mt-10 text-sm text-muted-foreground">
              Reading time is measured attention, not time with the tab open — it
              accrues only while the reader is on the page and active.
            </p>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function Fact({
  label, value, mono,
}: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-2 text-lg font-extrabold ${mono ? "font-mono text-base" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
