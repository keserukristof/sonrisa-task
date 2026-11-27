import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "./wordmark";

/**
 * The header of the signed-out pages: the wordmark and the links to the
 * account pages. Pass which links to show; a page leaves out its own.
 */
export function SiteHeader({
  signIn = false,
  signUp = false,
}: {
  signIn?: boolean;
  signUp?: boolean;
}) {
  return (
    <header className="border-border bg-card flex h-14 items-center gap-6 border-b px-4 md:px-6">
      <Wordmark href="/" />
      <div className="ml-auto flex items-center gap-2">
        {signIn ? (
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "ghost" })}
          >
            Sign in
          </Link>
        ) : null}
        {signUp ? (
          <Link
            href="/sign-up"
            className={buttonVariants({ variant: "outline" })}
          >
            Sign up
          </Link>
        ) : null}
      </div>
    </header>
  );
}
