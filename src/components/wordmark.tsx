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
        className="size-7 bg-foreground"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 68%, 68% 100%, 0 100%)" }}
      />
      <span className="text-[1.4rem] font-extrabold tracking-[-0.03em]">
        Adhyayan
      </span>
    </Link>
  );
}
