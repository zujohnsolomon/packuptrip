"use server";

import { createClient } from "@/lib/supabase/server";
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
};

export type UpdateProfilePayload = {
  name: string;
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

  // Contact details live in the RLS-protected host_contacts table (so private
  // fields are never readable by other users via the API). Normalise here —
  // strip @ from Instagram, ensure http(s) on website, null when empty.
  const c = payload.contact;
  const cleanWebsite = c.website.trim()
    ? c.website.trim().match(/^https?:\/\//)
      ? c.website.trim()
      : `https://${c.website.trim()}`
    : null;

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

  return { error: null };
}
