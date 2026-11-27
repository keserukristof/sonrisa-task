import { SeverityMark } from "@/components/severity-mark";
import type { Severity } from "@/lib/alerting/types";

const ROWS: readonly { severity: Severity; range: string }[] = [
  { severity: "low", range: "Magnitude 4.5 to 5.4" },
  { severity: "moderate", range: "Magnitude 5.5 to 6.4" },
  { severity: "high", range: "Magnitude 6.5 to 7.4" },
  { severity: "critical", range: "Magnitude 7.5 and above" },
];

/** The landing page's card: the one severity scale every event is shown on. */
export function SeverityScale() {
  return (
    <div>
      <div className="border-border bg-card rounded-lg border">
        <h2 className="border-border border-b px-4 py-3 text-sm font-semibold">
          One scale for every event
        </h2>
        <ul>
          {ROWS.map(({ severity, range }) => (
            <li
              key={severity}
              className="border-border flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <SeverityMark severity={severity} className="w-27.5" />
              <span className="text-muted-foreground text-sm">{range}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        Earthquakes of magnitude 4.5 and above, from the U.S. Geological Survey,
        checked every minute.
      </p>
    </div>
  );
}
