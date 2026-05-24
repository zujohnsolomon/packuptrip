import { redirect } from "next/navigation";

// `/admin` is just an entry point - the real first page is Overview.
export default function AdminIndex() {
  redirect("/admin/overview");
}
