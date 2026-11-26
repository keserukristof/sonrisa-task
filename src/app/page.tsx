import { Suspense } from "react";
import {
  SystemStatus,
  SystemStatusFallback,
} from "@/features/health/system-status";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Starter is running
      </h1>
      <p className="text-muted-foreground">
        Next.js and Supabase are wired together. Replace this page with the
        first feature.
      </p>
      <Suspense fallback={<SystemStatusFallback />}>
        <SystemStatus />
      </Suspense>
    </main>
  );
}
