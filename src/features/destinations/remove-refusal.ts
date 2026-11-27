/** The dialog's refusal when a destination is some alerts' only destination. */
export function removeRefusal(name: string, alertCount: number): string {
  const alerts = alertCount === 1 ? "1 alert" : `${alertCount} alerts`;
  return `${name} is the only destination of ${alerts}. Change them first.`;
}
