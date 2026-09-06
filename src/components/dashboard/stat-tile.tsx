export function StatTile({
  label,
  value,
  hint,
  surface,
}: {
  label: string;
  value: string;
  hint?: string;
  surface: string;
}) {
  return (
    <div className={`rounded-3xl p-5 text-deep ${surface}`}>
      <p className="text-sm font-bold uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tracking-[-0.03em] tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm font-medium opacity-75">{hint}</p> : null}
    </div>
  );
}
