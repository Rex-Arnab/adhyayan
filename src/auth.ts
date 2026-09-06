import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { endSession, getOrCreateSession } from "@/lib/session-manager";
import { loginSchema } from "@/lib/validation";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
          },
        });
        if (!user) {
          // Hash anyway so a missing account and a wrong password cost the same
          // wall-clock time — otherwise this endpoint enumerates registered emails.
          await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // passwordHash must never reach the token/session.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      // Opening the LearningSession here is what makes every later heartbeat
      // attributable to a sitting, even if the user never opens a chapter.
      const sessionId = await getOrCreateSession(user.id);
      await logEvent({ userId: user.id, sessionId, type: "AUTH_LOGIN" });
    },
    async signOut(message) {
      const userId =
        "token" in message ? (message.token?.id as string | undefined) : undefined;
      if (!userId) return;
      await logEvent({ userId, type: "AUTH_LOGOUT" });
      await endSession(userId, "logout");
    },
  },
});
