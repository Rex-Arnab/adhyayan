import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Edge-safe instance: authConfig has no providers, no bcrypt, no Prisma.
const { auth } = NextAuth(authConfig);

const PROTECTED = [/^\/dashboard/, /^\/learn/, /^\/admin/];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((re) => re.test(pathname));

  if (needsAuth && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }
  return undefined;
});

export const config = {
  // Skip static assets and image optimisation; everything else passes through.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
