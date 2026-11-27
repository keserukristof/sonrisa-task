"use client";

import { Hash } from "lucide-react";
import { useActionState, useState } from "react";
import { BrokenMark } from "@/components/broken-mark";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { initialActionResult, type ActionResult } from "@/lib/action-result";
import { sendTest } from "./actions";
import type { DestinationRow } from "./queries";
import { RemoveDestinationDialog } from "./remove-destination-dialog";
import { TestStatus } from "./test-status";
import { describeTestResult } from "./test-result";

/** A Slack destination: name, hint, broken reason, "Send test" and "Remove". */
export function SlackDestinationRow({
  destination,
}: {
  destination: DestinationRow;
}) {
  const [state, action] = useActionState<ActionResult, FormData>(
    sendTest,
    initialActionResult,
  );
  const [removing, setRemoving] = useState(false);
  const result = describeTestResult(state);
  const broken = destination.status === "broken";

  return (
    <li>
      <form
        action={action}
        className="flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:gap-4"
      >
        <input type="hidden" name="destinationId" value={destination.id} />
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Hash
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 size-5 shrink-0"
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold break-words">{destination.name}</p>
            <p className="text-muted-foreground break-words">
              Slack · {destination.hint}
            </p>
            {broken ? (
              <p className="text-destructive mt-1.5">
                <BrokenMark>Broken.</BrokenMark>{" "}
                {destination.brokenReason ?? ""}
              </p>
            ) : null}
            <TestStatus result={result} />
          </div>
        </div>
        <div className="flex gap-2">
          <SubmitButton
            variant="outline"
            size="default"
            pendingLabel="Sending…"
          >
            Send test
            <span className="sr-only"> to {destination.name}</span>
          </SubmitButton>
          <Button
            type="button"
            variant="outline"
            className="text-destructive"
            onClick={() => setRemoving(true)}
          >
            Remove
            <span className="sr-only"> {destination.name}</span>
          </Button>
        </div>
      </form>
      <RemoveDestinationDialog
        destinationId={destination.id}
        name={destination.name}
        open={removing}
        onOpenChange={setRemoving}
      />
    </li>
  );
}
