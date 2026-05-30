import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { hostUrl } from "@/lib/supabase/queries";
import { ProfileEditor } from "./ProfileEditor";
import type { Profile, HostContact } from "@/types/db";

export const metadata = { title: "Edit profile · Packuptrip" };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/account/profile");

  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase.from("host_contacts").select("*").eq("user_id", user.id).maybeSingle<HostContact>(),
  ]);

  if (!profile) redirect("/login");

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f8f5ef] pt-[4.5rem]">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 lg:py-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
            <div className="min-w-0">
              <Link
                href="/account"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600"
              >
                Back to account
              </Link>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45c3e]">
                Host profile editor
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#17120f] sm:text-[1.75rem]">
                Shape what travellers see
              </h1>
            </div>
            <Link
              href={hostUrl(profile)}
              className="inline-flex h-9 shrink-0 items-center rounded-lg border border-stone-200 bg-white px-4 text-[13px] font-bold text-stone-700 shadow-sm hover:bg-stone-50"
            >
              Preview public page
            </Link>
          </div>

          <ProfileEditor profile={profile} contact={contact ?? null} />
        </div>
      </main>
      <Footer />
    </>
  );
}
