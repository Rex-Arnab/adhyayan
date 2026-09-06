import Link from "next/link";

/**
 * The mark is a filled square with a cut corner — a page turning — so the brand
 * reads without depending on an icon font or an external asset.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2.5 ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="size-6 shrink-0 bg-foreground sm:size-7"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 68%, 68% 100%, 0 100%)" }}
      />
      <span className="whitespace-nowrap text-[1.25rem] font-extrabold tracking-[-0.03em] sm:text-[1.4rem]">
        Adhyayan
      </span>
    </Link>
  );
}
