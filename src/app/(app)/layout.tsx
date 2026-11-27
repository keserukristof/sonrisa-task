import { Suspense, type ReactNode } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/app-header";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";

/**
 * The shell of every signed-in page. It only draws the header: each page
 * guards itself with `requireUser()` or `requireAdmin()`, inside `<Suspense>`.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<AppHeaderFallback />}>
        <Header />
      </Suspense>
      {children}
    </>
  );
}

async function Header() {
  const user = await getCurrentUser();
  if (!user) return <AppHeaderFallback />;

  return (
    <AppHeader
      email={user.email}
      isAdmin={await isCurrentUserAdmin()}
      signOutAction={signOut}
    />
  );
}
