import Link from "next/link";
import { Notice } from "@/components/notice";
import { Pager } from "@/components/pager";
import { buttonVariants } from "@/components/ui/button";
import { getAdminUserPage } from "./queries";
import { parsePage } from "./rows";
import { UserList } from "./user-list";

/** Request-time Server Component: render it inside `<Suspense>`. */
export async function UsersView({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = parsePage(pageParam);
  const result = await getAdminUserPage(requested);

  if (!result.ok) {
    return (
      <Notice variant="error">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Couldn&apos;t load the users.</span>
          <Link
            href={{ pathname: "/admin/users", query: { page: requested } }}
            className={buttonVariants({ variant: "outline" })}
          >
            Try again
          </Link>
        </div>
      </Notice>
    );
  }

  return (
    <>
      <UserList rows={result.rows} />
      <Pager
        pathname="/admin/users"
        page={result.page}
        hasNext={result.hasNext}
      />
    </>
  );
}
