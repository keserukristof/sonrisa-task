import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <div>
        <Link href="/" className="underline underline-offset-4">
          Back to the home page
        </Link>
      </div>
    </main>
  );
}
