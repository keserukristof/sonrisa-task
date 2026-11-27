"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { NotificationStatus } from "@/components/notification-status";
import { SubmitButton } from "@/components/submit-button";
import { initialActionResult, type ActionResult } from "@/lib/action-result";
import { sendTest } from "./actions";
import { describeTestResult } from "./test-result";

/** The account email destination, with its "Send test" button and inline result. */
export function EmailDestinationRow({
  destinationId,
  accountEmail,
}: {
  destinationId: string;
  accountEmail: string;
}) {
  const [state, action] = useActionState<ActionResult, FormData>(
    sendTest,
    initialActionResult,
  );
  const result = describeTestResult(state);

  return (
    <li>
      <form
        action={action}
        className="flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:gap-4"
      >
        <input type="hidden" name="destinationId" value={destinationId} />
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Mail
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 size-5 shrink-0"
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">Account email</p>
            <p className="break-words">{accountEmail}</p>
            <p className="text-muted-foreground">
              Created with your account. It can&apos;t be removed.
            </p>
            <div role="status" className={result ? "mt-2.5" : undefined}>
              {result ? (
                <NotificationStatus
                  status={result.status}
                  label={result.label}
                />
              ) : null}
            </div>
          </div>
        </div>
        <SubmitButton variant="outline" size="default" pendingLabel="Sending…">
          Send test
        </SubmitButton>
      </form>
    </li>
  );
}
