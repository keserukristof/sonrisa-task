import { redirect } from "next/navigation";

/** The admin area has one page in increment 1. */
export default function AdminPage() {
  redirect("/admin/simulate");
}
