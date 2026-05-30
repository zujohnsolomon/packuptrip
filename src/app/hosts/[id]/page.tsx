import { notFound, redirect } from "next/navigation";
import { HostProfileView } from "@/components/host-profile/HostProfileView";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_PROFILE_COLUMNS } from "@/lib/supabase/queries";
import type { Profile } from "@/types/db";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  // Username slugs are handled by the canonical /<username> route.
  if (!UUID_RE.test(slug)) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("name, bio")
    .eq("id", slug)
    .single<Pick<Profile, "name" | "bio">>();
  if (!data) return { title: "Host · Packuptrip" };
  return {
    title: `${data.name} · Packuptrip`,
    description:
      data.bio?.slice(0, 160) ??
      `${data.name} hosts community trips on Packuptrip.`,
  };
}

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;

  // A username was passed to the old path — send it to the canonical root URL.
  if (!UUID_RE.test(slug)) {
    redirect(`/${slug}`);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("id", slug)
    .single<Profile>();

  if (!profile) notFound();

  // Hosts with a username live at /<username>; redirect there for canonical URLs.
  if (profile.username) {
    redirect(`/${profile.username}`);
  }

  // Username-less host — render here at /hosts/<uuid>.
  return <HostProfileView profile={profile} />;
}
