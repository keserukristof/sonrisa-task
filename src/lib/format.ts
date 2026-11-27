const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

const timeOnly = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

/** "27 Nov 2026, 13:42 UTC". Every time in the product is shown this way. */
export function formatUtcDateTime(value: Date | string): string {
  return `${dateTime.format(new Date(value))} UTC`;
}

/** "13:42 UTC", for a time next to a row that already shows the date. */
export function formatUtcTime(value: Date | string): string {
  return `${timeOnly.format(new Date(value))} UTC`;
}
