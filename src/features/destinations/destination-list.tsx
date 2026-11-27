import { Skeleton } from "@/components/ui/skeleton";
import { EmailDestinationRow } from "./email-destination-row";
import { listDestinations } from "./queries";
import { SlackDestinationRow } from "./slack-destination-row";

export async function DestinationList() {
  const { accountEmail, destinations } = await listDestinations();

  if (destinations.length === 0) {
    return (
      <p className="border-border bg-card text-muted-foreground rounded-lg border px-4 py-3 text-sm">
        No destinations yet. Your account email appears here once it is set up.
      </p>
    );
  }

  return (
    <ul className="border-border bg-card divide-border divide-y rounded-lg border">
      {destinations.map((destination) =>
        destination.channelType === "slack" ? (
          <SlackDestinationRow key={destination.id} destination={destination} />
        ) : (
          <EmailDestinationRow
            key={destination.id}
            destinationId={destination.id}
            accountEmail={accountEmail}
          />
        ),
      )}
    </ul>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <Skeleton className="size-5" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export function DestinationListSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="border-border bg-card divide-border divide-y rounded-lg border"
    >
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}
