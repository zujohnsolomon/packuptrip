import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyThreads } from "@/lib/supabase/queries";
import { MessagesSidebar } from "./MessagesSidebar";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/messages");

  const threads = await getMyThreads();

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f1e9da]">
      <MessagesSidebar threads={threads} currentUserId={user.id} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
