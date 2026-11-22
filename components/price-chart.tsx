const WIDTH = 320;
const HEIGHT = 160;
const PAD_X = 10;
const PAD_Y = 16;

function plotPoints(values: number[], min: number, max: number): string[] {
  const span = max - min || 1;
  const step =
    values.length > 1 ? (WIDTH - PAD_X * 2) / (values.length - 1) : 0;
  return values.map((value, index) => {
    const x = PAD_X + index * step;
    const y = PAD_Y + (1 - (value - min) / span) * (HEIGHT - PAD_Y * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
}

export function Sparkline({
  values,
  className = "",
}: {
  values: number[];
  className?: string;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = plotPoints(values, min, max).join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PriceChart({
  values,
  msp,
  ariaLabel,
}: {
  values: number[];
  msp?: number;
  ariaLabel: string;
}) {
  if (values.length < 2) return null;

  const scaleValues = msp === undefined ? values : [...values, msp];
  const min = Math.min(...scaleValues);
  const max = Math.max(...scaleValues);
  const points = plotPoints(values, min, max);
  const span = max - min || 1;
  const mspY =
    msp === undefined
      ? undefined
      : PAD_Y + (1 - (msp - min) / span) * (HEIGHT - PAD_Y * 2);
  const bottom = HEIGHT - PAD_Y;
  const area = `M${PAD_X},${bottom} L${points.join(" L")} L${
    WIDTH - PAD_X
  },${bottom} Z`;
  const last = points.at(-1)!.split(",");

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
    >
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={PAD_Y + ratio * (HEIGHT - PAD_Y * 2)}
          y2={PAD_Y + ratio * (HEIGHT - PAD_Y * 2)}
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="2 6"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <path d={area} fill="var(--brand)" opacity="0.09" />

      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {mspY !== undefined ? (
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={mspY}
          y2={mspY}
          stroke="var(--tipis)"
          strokeWidth="2"
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      <circle
        cx={last[0]}
        cy={last[1]}
        r="4"
        fill="var(--brand)"
        stroke="var(--surface)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
