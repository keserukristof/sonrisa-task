import { Suspense } from "react";
import {
  AdminFrame,
  AdminFrameFallback,
} from "@/features/admin/frame/admin-frame";
import { UserListSkeleton } from "@/features/admin/users/user-list";
import { UsersView } from "@/features/admin/users/users-view";
import { requireAdmin } from "@/lib/auth/session";

/** Nothing of it is in the static shell: see AdminFrame. */
export default function Page({ searchParams }: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<AdminFrameFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: Pick<PageProps<"/admin/users">, "searchParams">) {
  await requireAdmin();
  return (
    <AdminFrame current="users">
      <Suspense fallback={<UserListSkeleton />}>
        <UsersView searchParams={searchParams} />
      </Suspense>
    </AdminFrame>
  );
}
