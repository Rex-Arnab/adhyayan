"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side detail stays server-side; the digest is the only safe handle.
    console.error("[app] unhandled error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-extrabold tracking-[-0.03em]">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This one is on us. Try again — if it keeps happening, the reference below
        will help us find it.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
      >
        Try again
      </button>
    </div>
  );
}
