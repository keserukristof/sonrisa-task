"use client";

import { useFormStatus } from "react-dom";
import { NotificationStatus } from "@/components/notification-status";
import type { describeTestResult } from "./test-result";

/**
 * The inline result of "Send test". It empties while a send is pending, so a
 * second identical result is a change in the live region and is announced.
 */
export function TestStatus({
  result,
}: {
  result: ReturnType<typeof describeTestResult>;
}) {
  const { pending } = useFormStatus();
  const shown = pending ? null : result;
  return (
    <div role="status" className={shown ? "mt-2.5" : undefined}>
      {shown ? (
        <NotificationStatus status={shown.status} label={shown.label} />
      ) : null}
    </div>
  );
}
