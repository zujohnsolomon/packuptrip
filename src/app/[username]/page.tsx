import { notFound } from "next/navigation";
import { HostProfileView } from "@/components/host-profile/HostProfileView";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_PROFILE_COLUMNS } from "@/lib/supabase/queries";
import { isReservedUsername } from "@/lib/reserved-usernames";
import type { Profile } from "@/types/db";

export const dynamic = "force-dynamic";

async function loadByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("username", username.toLowerCase())
    .single<Profile>();
  return data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (isReservedUsername(username)) return {};
  const profile = await loadByUsername(username);
  if (!profile) return { title: "Not found · Packuptrip" };
  return {
    title: `${profile.name} · Packuptrip`,
    description:
      profile.bio?.slice(0, 160) ??
      `${profile.name} hosts community trips on Packuptrip.`,
  };
}

export default async function UsernameProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Reserved words belong to real routes — never a profile.
  if (isReservedUsername(username)) notFound();

  const profile = await loadByUsername(username);
  if (!profile) notFound();

  return <HostProfileView profile={profile} />;
}
