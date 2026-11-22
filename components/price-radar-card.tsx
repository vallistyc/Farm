import Link from "next/link";
import { Sparkline } from "@/components/price-chart";
import { formatPercentChange } from "@/lib/format";

type PriceRadarCardProps = {
  title: string;
  price: string;
  unit: string;
  observedLabel: string;
  sourceLabel: string;
  sourceLive: boolean;
  change: number;
  changeLabel: string;
  values: number[];
  href?: string;
};

export function PriceRadarCard({
  title,
  price,
  unit,
  observedLabel,
  sourceLabel,
  sourceLive,
  change,
  changeLabel,
  values,
  href,
}: PriceRadarCardProps) {
  const trendColor =
    change > 0 ? "text-aman" : change < 0 ? "text-rugi" : "text-ink-muted";
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{title}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {observedLabel}
          </p>
          <p
            className={`mt-0.5 truncate text-[11px] ${
              sourceLive ? "text-aman" : "text-ink-muted"
            }`}
          >
            {sourceLabel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold tracking-tight">{price}</p>
          <p className="text-[11px] text-ink-muted">{unit}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Sparkline
          values={values}
          className={`h-7 w-20 shrink-0 ${trendColor}`}
        />
        <p className={`text-xs font-semibold ${trendColor}`}>
          <span aria-hidden="true">{arrow} </span>
          {formatPercentChange(change)}
          <span className="ml-1.5 font-normal text-ink-muted">
            {changeLabel}
          </span>
        </p>
        {href ? (
          <span
            aria-hidden="true"
            className="ml-auto text-lg text-ink-muted"
          >
            ›
          </span>
        ) : null}
      </div>
    </>
  );

  const className = "block rounded-2xl border border-line bg-surface p-4";

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={`${className} transition-colors hover:bg-surface-muted`}
    >
      {content}
    </Link>
  );
}
