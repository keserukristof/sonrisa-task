/**
 * How much of a fixed amount is used: the email budget. It never changes
 * colour; the numbers next to it carry the meaning. `label` repeats them for
 * screen readers.
 */
export function Meter({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const share = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  return (
    <div
      role="img"
      aria-label={label}
      className="bg-muted h-2 overflow-hidden rounded-full"
    >
      <div
        className="bg-foreground h-full"
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </div>
  );
}
