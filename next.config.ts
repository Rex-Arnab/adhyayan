import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer must not be bundled by the App Router compiler —
  // doing so crashes the certificate PDF route at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
