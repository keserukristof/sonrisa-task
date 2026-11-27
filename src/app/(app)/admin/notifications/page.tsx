import { Suspense } from "react";
import {
  AdminFrame,
  AdminFrameFallback,
} from "@/features/admin/frame/admin-frame";
import { AdminNotificationListSkeleton } from "@/features/admin/notifications/notification-list";
import {
  AdminNotificationsView,
  StatusFilter,
  StatusFilterSkeleton,
} from "@/features/admin/notifications/notifications-view";
import { requireAdmin } from "@/lib/auth/session";

/** Nothing of it is in the static shell: see AdminFrame. */
export default function Page({
  searchParams,
}: PageProps<"/admin/notifications">) {
  return (
    <Suspense fallback={<AdminFrameFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: Pick<PageProps<"/admin/notifications">, "searchParams">) {
  await requireAdmin();
  return (
    <AdminFrame current="notifications">
      <Suspense fallback={<StatusFilterSkeleton />}>
        <StatusFilter searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<AdminNotificationListSkeleton />}>
        <AdminNotificationsView searchParams={searchParams} />
      </Suspense>
    </AdminFrame>
  );
}
