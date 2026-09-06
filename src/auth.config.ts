import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe slice of the Auth.js config.
 *
 * This file is imported by `src/middleware.ts`, which runs on the Edge runtime.
 * It must NOT import bcrypt, Prisma, or anything else that needs Node built-ins —
 * the Credentials provider lives in `src/auth.ts` for exactly that reason.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "STUDENT";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
