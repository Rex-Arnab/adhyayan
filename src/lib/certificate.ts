import { makeSerial } from "@/lib/certificate-serial";
import { db } from "@/lib/db";

export type IssuedCertificate = { serial: string; alreadyExisted: boolean };

/**
 * Issues a certificate for a completed enrolment, exactly once.
 *
 * `enrollmentId` is unique on Certificate, so a concurrent double-completion
 * loses the race at the database rather than minting a second serial. The caller
 * runs this inside the completion transaction.
 */
export async function issueCertificate(
  tx: Pick<typeof db, "certificate" | "enrollment">,
  enrollmentId: string,
): Promise<IssuedCertificate | null> {
  const existing = await tx.certificate.findUnique({
    where: { enrollmentId },
    select: { serial: true },
  });
  if (existing) return { serial: existing.serial, alreadyExisted: true };

  const enrollment = await tx.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      status: true,
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  if (!enrollment || enrollment.status !== "COMPLETED") return null;

  // Retry on the (astronomically unlikely) serial collision rather than 500.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await tx.certificate.create({
        data: {
          enrollmentId,
          serial: makeSerial(),
          // Snapshot both: a later rename must not rewrite an issued certificate.
          learnerName: enrollment.user.name,
          courseTitle: enrollment.course.title,
        },
        select: { serial: true },
      });
      return { serial: created.serial, alreadyExisted: false };
    } catch {
      const raced = await tx.certificate.findUnique({
        where: { enrollmentId },
        select: { serial: true },
      });
      if (raced) return { serial: raced.serial, alreadyExisted: true };
    }
  }
  return null;
}

export async function getCertificateBySerial(serial: string) {
  return db.certificate.findUnique({
    where: { serial },
    select: {
      id: true,
      serial: true,
      learnerName: true,
      courseTitle: true,
      issuedAt: true,
      downloads: true,
      enrollment: {
        select: {
          completedAt: true,
          course: { select: { slug: true, estimatedMinutes: true } },
          chapters: { select: { activeSeconds: true } },
        },
      },
    },
  });
}
