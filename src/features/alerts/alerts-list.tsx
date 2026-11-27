"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { KeywordChip } from "@/components/simulated-badge";
import { Notice } from "@/components/notice";
import { SeverityMark } from "@/components/severity-mark";
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
import { Switch } from "@/components/ui/switch";
import { CATEGORY_LABELS } from "@/lib/alerting/types";
import { deleteAlert, setAlertActive } from "./actions";
import type { AlertSummary } from "./queries";

export function AlertsList({ alerts }: { alerts: AlertSummary[] }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      {error ? (
        <Notice variant="error" className="mb-6">
          {error}
        </Notice>
      ) : null}
      <div className="border-border bg-card rounded-lg border">
        <ul className="divide-border divide-y">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onError={setError} />
          ))}
        </ul>
      </div>
    </>
  );
}

function AlertRow({
  alert,
  onError,
}: {
  alert: AlertSummary;
  onError: (message: string | null) => void;
}) {
  const [active, setActive] = useOptimistic(alert.active);
  const [, startTransition] = useTransition();

  function toggle(next: boolean) {
    onError(null);
    startTransition(async () => {
      setActive(next);
      const result = await setAlertActive(alert.id, next);
      if (!result.ok) onError(result.message ?? "Couldn't update the alert.");
    });
  }

  return (
    <li className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{alert.name}</p>
        <p className="text-muted-foreground text-sm">
          {CATEGORY_LABELS[alert.category]}, to{" "}
          {alert.destinationNames.join(", ")}
        </p>
        {alert.keywords.length > 0 ? (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {alert.keywords.map((keyword) => (
              <li key={keyword}>
                <KeywordChip>{keyword}</KeywordChip>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="sm:w-42.5">
        <SeverityMark severity={alert.minSeverity} kind="minimum" />
      </div>
      <div className="flex items-center justify-between gap-4 sm:contents">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={active}
            onCheckedChange={toggle}
            aria-label={`${alert.name} is ${active ? "active" : "paused"}`}
          />
          <span className="w-12">{active ? "Active" : "Paused"}</span>
        </label>
        <div className="flex items-center gap-2">
          <Link
            href={`/alerts/${alert.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
            <span className="sr-only"> {alert.name}</span>
          </Link>
          <DeleteAlert alert={alert} />
        </div>
      </div>
    </li>
  );
}

function DeleteAlert({ alert }: { alert: AlertSummary }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAlert(alert.id);
      if (!result.ok) setError(result.message ?? "Couldn't delete the alert.");
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        Delete
        <span className="sr-only"> {alert.name}</span>
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
          if (!next) setError(null);
        }}
      >
        <AlertDialogContent initialFocus={cancelRef}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{alert.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              It stops matching events. Past notifications stay in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <Notice variant="error">{error}</Notice> : null}
          <AlertDialogFooter>
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
              {pending ? "Deleting…" : "Delete alert"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
