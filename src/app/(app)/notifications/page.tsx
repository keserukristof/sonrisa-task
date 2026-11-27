import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { NotificationListSkeleton } from "@/features/notifications/notification-list";
import { NotificationsView } from "@/features/notifications/notifications-view";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Notifications" };

export default function Page({ searchParams }: PageProps<"/notifications">) {
  return (
    <PageContainer width="list">
      <PageHeader title="Notifications" />
      <Suspense fallback={<NotificationListSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Content({
  searchParams,
}: Pick<PageProps<"/notifications">, "searchParams">) {
  await requireUser("/notifications");
  return <NotificationsView searchParams={searchParams} />;
}
