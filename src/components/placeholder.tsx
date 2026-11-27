/**
 * Stands in for a page's content until its ticket builds it. Each ticket
 * removes its own use; delete this file with the last one.
 */
export function Placeholder({ ticket }: { ticket: number }) {
  return (
    <p className="text-muted-foreground text-sm">
      This page is built in ticket #{ticket}.
    </p>
  );
}
