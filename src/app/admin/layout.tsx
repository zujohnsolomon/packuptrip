import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { getOpenReportsCount } from "@/lib/supabase/queries";
import { getPendingVerificationCount } from "@/actions/verification";
import type { Profile } from "@/types/db";

export const metadata = {
  title: "Admin · Packuptrip",
  robots: { index: false, follow: false },
};

// Auth check runs on every admin route; force-dynamic so we never serve a
// stale "permitted" shell to a non-admin user.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If Supabase env isn't set (e.g. first run on a fresh checkout) we fall
  // through to the children, which will render their own "not configured"
  // states. Don't block local dev on missing env.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → kick to login, then bounce back to /admin after.
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  // Signed in but not admin → kick to /account silently. No "you're not
  // authorised" message; we don't want to telegraph that /admin exists.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "admin") {
    redirect("/account");
  }

  // Live unresolved-reports count for the sidebar badge. Cheap query
  // (single COUNT with a WHERE on indexed column).
  const [openReportsCount, pendingVerificationsCount] = await Promise.all([
    getOpenReportsCount(),
    getPendingVerificationCount(),
  ]);

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar
        userName={profile.name}
        openReportsCount={openReportsCount}
        pendingVerificationsCount={pendingVerificationsCount}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
