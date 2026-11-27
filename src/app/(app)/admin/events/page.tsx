import { Suspense } from "react";
import {
  AdminFrame,
  AdminFrameFallback,
} from "@/features/admin/frame/admin-frame";
import { EventListSkeleton } from "@/features/admin/events/event-list";
import { EventsView } from "@/features/admin/events/events-view";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Nothing of it is in the static shell: see AdminFrame. The admin check comes
 * first, so a non-admin gets the not-found page and sees no frame.
 */
export default function Page({ searchParams }: PageProps<"/admin/events">) {
  return (
    <Suspense fallback={<AdminFrameFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: {
  searchParams: PageProps<"/admin/events">["searchParams"];
}) {
  await requireAdmin();
  return (
    <AdminFrame current="events">
      <Suspense fallback={<EventListSkeleton />}>
        <EventsView searchParams={searchParams} />
      </Suspense>
    </AdminFrame>
  );
}
