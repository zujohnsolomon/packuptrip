"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateProfilePayload = {
  name: string;
  bio: string;
  homeCity: string;
  travelStyleTags: string[];
  languages: string[];
  countriesVisited: string[];
  profileGallery: string[];
  avatarUrl?: string | null;
};

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const update: Record<string, unknown> = {
    name: payload.name.trim() || "Traveller",
    bio: payload.bio.trim() || null,
    home_city: payload.homeCity.trim() || null,
    travel_style_tags: payload.travelStyleTags,
    languages: payload.languages,
    countries_visited: payload.countriesVisited,
    profile_gallery: payload.profileGallery,
  };

  if (payload.avatarUrl !== undefined) {
    update.avatar_url = payload.avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile failed:", error);
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath(`/hosts/${user.id}`);

  return { error: null };
}
