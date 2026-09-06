import { auth } from "@/auth";
import { db } from "@/lib/db";

export type CurrentUser = { id: string; name: string; role: "STUDENT" | "ADMIN" };

/**
 * Resolves the session AND confirms the user row still exists.
 *
 * With a JWT strategy and no database adapter, a token stays cryptographically
 * valid after its User row is gone (re-seeding, an account deletion). Every
 * write keyed on that id then fails with a foreign-key violation. Mutations must
 * therefore verify existence — one indexed lookup — rather than trusting the
 * token's `sub`. Reads can stay optimistic; a stale read renders logged-out.
 */
export async function requireUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true },
  });
  return user ?? null;
}
