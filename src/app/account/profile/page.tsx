import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
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
    // Owner can read their own full contact row (RLS allows user_id = auth.uid())
    supabase.from("host_contacts").select("*").eq("user_id", user.id).maybeSingle<HostContact>(),
  ]);

  if (!profile) redirect("/login");

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f8f5ef] pt-20">
        <section className="border-b border-stone-200/80 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
              href="/account"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400 hover:text-stone-600"
            >
              Back to account
            </Link>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#b35a42]">
                  Host profile editor
                </p>
                <h1
                  className="mt-3 font-serif font-semibold leading-tight tracking-tight text-[#17120f]"
                  style={{
                    fontSize: "clamp(2.4rem, 5vw, 4.25rem)",
                    fontVariationSettings: "'opsz' 144, 'SOFT' 0",
                  }}
                >
                  Shape what travellers see.
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                  Everything here powers your public host profile: hero photo,
                  intro, About section, travel style, languages and trust facts.
                </p>
              </div>
              <Link
                href={`/hosts/${profile.id}`}
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#17120f] px-5 text-sm font-bold text-white shadow-sm hover:bg-stone-800"
              >
                Preview public page
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <ProfileEditor profile={profile} contact={contact ?? null} />
        </div>
      </main>
      <Footer />
    </>
  );
}
