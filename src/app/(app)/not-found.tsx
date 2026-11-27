import type { Metadata } from "next";
import { NotFoundCard } from "@/components/not-found-card";

export const metadata: Metadata = { title: "Page not found" };

/** Not-found inside the signed-in area: the `(app)` layout supplies the header. */
export default function NotFound() {
  return <NotFoundCard />;
}
