import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
