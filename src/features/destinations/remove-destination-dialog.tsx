"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Notice } from "@/components/notice";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { removeDestination } from "./actions";

/**
 * Confirms removing a Slack destination. The server decides whether it may
 * go: a refusal stays inside the dialog and moves focus to "Close".
 */
export function RemoveDestinationDialog({
  destinationId,
  name,
  open,
  onOpenChange,
}: {
  destinationId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [refusal, setRefusal] = useState<{
    message: string;
    refused: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // The refusal swaps the buttons: focus "Close" once it has mounted.
  const refused = refusal?.refused === true;
  useEffect(() => {
    if (refused) closeRef.current?.focus();
  }, [refused]);

  function confirm() {
    setRefusal(null);
    startTransition(async () => {
      const result = await removeDestination(destinationId, name);
      if (!result.ok) {
        setRefusal({
          message: result.message ?? "Couldn't remove the destination.",
          refused: result.code === "only_destination",
        });
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
        if (!next) setRefusal(null);
      }}
    >
      <AlertDialogContent initialFocus={cancelRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove &quot;{name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Alerts stop sending to this channel. Past notifications stay in your
            history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {refusal ? <Notice variant="error">{refusal.message}</Notice> : null}
        <AlertDialogFooter>
          {refusal?.refused ? (
            <>
              <Link
                href="/alerts"
                className={buttonVariants({ variant: "outline" })}
              >
                Go to alerts
              </Link>
              <AlertDialogCancel ref={closeRef}>Close</AlertDialogCancel>
            </>
          ) : (
            <>
              <AlertDialogCancel ref={cancelRef} disabled={pending}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                focusableWhenDisabled
                disabled={pending}
                onClick={confirm}
                className="data-disabled:pointer-events-none data-disabled:opacity-50"
              >
                {pending ? "Removing…" : "Remove destination"}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
