export function ProgressRing({
  value,
  size = 44,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={label ?? `${clamped}% complete`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={stroke}
          className="stroke-foreground/15"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="stroke-success transition-[stroke-dashoffset] duration-200"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold tabular-nums">
        {clamped}
      </span>
    </div>
  );
}
