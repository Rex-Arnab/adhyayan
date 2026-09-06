import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { auth } from "@/auth";
import { CertificateDocument } from "@/lib/certificate-pdf";
import { getCertificateBySerial } from "@/lib/certificate";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { getAppOrigin } from "@/lib/origin";

// react-pdf needs Node built-ins; it is not Edge-compatible. The package is also
// in serverExternalPackages (next.config.ts) or App Router bundling breaks it.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serial: string }> },
) {
  const { serial } = await params;

  const certificate = await getCertificateBySerial(serial);
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const origin = await getAppOrigin();
  const verifyPath = `/certificates/${certificate.serial}`;
  const verifyUrl = `${origin}${verifyPath}`;

  const qrDataUri = await QRCode.toDataURL(verifyUrl, {
    margin: 0,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#10242FFF", light: "#FFFFFFFF" },
  });

  const activeMinutes = Math.round(
    certificate.enrollment.chapters.reduce((s, c) => s + c.activeSeconds, 0) / 60,
  );

  const buffer = await renderToBuffer(
    CertificateDocument({
      learnerName: certificate.learnerName,
      courseTitle: certificate.courseTitle,
      issuedAt: certificate.issuedAt,
      serial: certificate.serial,
      activeMinutes,
      qrDataUri,
      // Shown under the QR, so keep it short enough to stay legible in print.
      verifyUrl: verifyUrl.replace(/^https?:\/\//, ""),
    }),
  );

  await db.certificate.update({
    where: { id: certificate.id },
    data: { downloads: { increment: 1 } },
  });

  const session = await auth();
  await logEvent({
    userId: session?.user?.id ?? null,
    type: "CERTIFICATE_DOWNLOAD",
    metadata: { serial: certificate.serial },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="adhyayan-${certificate.serial}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
