"use server";

import { createClient } from "@/lib/supabase/server";
import { isReservedUsername } from "@/lib/reserved-usernames";
import { revalidatePath } from "next/cache";

export type ContactChannel = "phone" | "whatsapp" | "email" | "instagram" | "website";

export type ContactDraft = {
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  website: string;
  phonePublic: boolean;
  whatsappPublic: boolean;
  emailPublic: boolean;
  instagramPublic: boolean;
  websitePublic: boolean;
  // Social profile links (always public)
  facebook: string;
  youtube: string;
  linkedin: string;
  twitter: string;
};

export type UpdateProfilePayload = {
  name: string;
  username: string;
  bio: string;
  homeCity: string;
  travelStyleTags: string[];
  languages: string[];
  countriesVisited: string[];
  profileGallery: string[];
  contact: ContactDraft;
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

  const usernameRaw = payload.username.trim().toLowerCase();
  const usernameValid = /^[a-z0-9_]{3,30}$/.test(usernameRaw);

  // Block usernames that collide with real routes (e.g. "packages", "about").
  if (usernameRaw && isReservedUsername(usernameRaw)) {
    return { error: "That username is reserved. Please choose another." };
  }

  const update: Record<string, unknown> = {
    name: payload.name.trim() || "Traveller",
    username: usernameValid ? usernameRaw : null,
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

  const c = payload.contact;
  const cleanWebsite = c.website.trim()
    ? c.website.trim().match(/^https?:\/\//)
      ? c.website.trim()
      : `https://${c.website.trim()}`
    : null;

  const cleanSocialUrl = (val: string) => {
    const t = val.trim();
    if (!t) return null;
    return t.match(/^https?:\/\//) ? t : `https://${t}`;
  };

  const { error: contactErr } = await supabase
    .from("host_contacts")
    .upsert(
      {
        user_id: user.id,
        phone: c.phone.trim() || null,
        whatsapp: c.whatsapp.replace(/\D/g, "") || null,
        email: c.email.trim().toLowerCase() || null,
        instagram: c.instagram.trim().replace(/^@/, "") || null,
        website: cleanWebsite,
        phone_public: c.phonePublic,
        whatsapp_public: c.whatsappPublic,
        email_public: c.emailPublic,
        instagram_public: c.instagramPublic,
        website_public: c.websitePublic,
        facebook: cleanSocialUrl(c.facebook),
        youtube: cleanSocialUrl(c.youtube),
        linkedin: cleanSocialUrl(c.linkedin),
        twitter: c.twitter.trim().replace(/^@/, "") || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (contactErr) {
    console.error("updateProfile (contacts) failed:", contactErr);
    return { error: contactErr.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath(`/hosts/${user.id}`);
  if (usernameValid) {
    revalidatePath(`/${usernameRaw}`);
  }

  return { error: null };
}
