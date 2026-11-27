"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";
import { NOTICES, isNoticeKey } from "@/lib/notices";
import { Notice } from "./notice";

/**
 * Shows the success notice an action left in the query string, if any:
 * `<FlashNotice notice={await searchParams.notice} />`. See `@/lib/notices`.
 *
 * The notice takes focus when it appears: the action that led here (a delete
 * confirm, a form submit) has gone, and focus would otherwise fall to <body>.
 */
export function FlashNotice({
  notice,
  className,
}: {
  notice: unknown;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = isNoticeKey(notice);

  useEffect(() => {
    if (shown) ref.current?.focus();
  }, [shown, notice]);

  if (!isNoticeKey(notice)) return null;
  return (
    <div ref={ref} tabIndex={-1} className={cn("outline-none", className)}>
      <Notice variant="success">{NOTICES[notice]}</Notice>
    </div>
  );
}
