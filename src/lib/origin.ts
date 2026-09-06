import { headers } from "next/headers";

/**
 * The public origin of this deployment.
 *
 * `request.url` inside a route handler is the address the server BOUND to, not
 * the host the user typed — behind any proxy it is localhost, which would bake
 * "http://localhost:3000" into every certificate QR code while passing all local
 * tests. Prefer an explicit env var, then the forwarded headers, then Host.
 */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.APP_ORIGIN ?? process.env.AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";

  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
