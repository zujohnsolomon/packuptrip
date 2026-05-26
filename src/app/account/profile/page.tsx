import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./ProfileEditor";
import type { Profile } from "@/types/db";

export const metadata = { title: "Edit profile · Packuptrip" };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/account/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/account"
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              ← Account
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
              Edit your profile
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              This is what other travellers see when they click your name.
            </p>
          </div>

          <ProfileEditor profile={profile} />
        </div>
      </main>
      <Footer />
    </>
  );
}
