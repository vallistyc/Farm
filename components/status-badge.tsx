import type { PriceStatus } from "@/lib/pricing";

const STYLES: Record<PriceStatus, { wrap: string; dot: string }> = {
  aman: { wrap: "border-aman/30 bg-aman/10 text-aman", dot: "bg-aman" },
  tipis: { wrap: "border-tipis/30 bg-tipis/10 text-tipis", dot: "bg-tipis" },
  rugi: { wrap: "border-rugi/30 bg-rugi/10 text-rugi", dot: "bg-rugi" },
};

export function StatusBadge({
  status,
  label,
}: {
  status: PriceStatus;
  label: string;
}) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.wrap}`}
    >
      <span className={`size-2 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
