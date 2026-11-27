import type { Metadata } from "next";
import { NotFoundCard } from "@/components/not-found-card";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Shown for a path that does not exist. Inside the signed-in area the
 * `(app)` not-found draws the card under that layout's own header instead.
 */
export default function NotFound() {
  return (
    <>
      <header className="border-border bg-card flex h-14 items-center border-b px-4 md:px-6">
        <Wordmark href="/" />
      </header>
      <NotFoundCard />
    </>
  );
}
