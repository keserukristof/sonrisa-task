import { NOTICES, isNoticeKey } from "@/lib/notices";
import { Notice } from "./notice";

/**
 * Shows the success notice an action left in the query string, if any:
 * `<FlashNotice notice={(await searchParams).notice} />`. See `@/lib/notices`.
 */
export function FlashNotice({
  notice,
  className,
}: {
  notice: unknown;
  className?: string;
}) {
  if (!isNoticeKey(notice)) return null;
  return (
    <Notice variant="success" className={className}>
      {NOTICES[notice]}
    </Notice>
  );
}
