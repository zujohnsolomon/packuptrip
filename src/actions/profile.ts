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

  // Normalise contact fields — trim, strip @ from Instagram, ensure http(s)
  // on website, keep null when empty so the public profile cleanly hides
  // unset rows.
  const c = payload.contact;
  const cleanPhone     = c.phone.trim() || null;
  const cleanWhatsapp  = c.whatsapp.replace(/\D/g, "") || null;
  const cleanEmail     = c.email.trim().toLowerCase() || null;
  const cleanInstagram = c.instagram.trim().replace(/^@/, "") || null;
  const cleanWebsite   = c.website.trim()
    ? c.website.trim().match(/^https?:\/\//)
      ? c.website.trim()
      : `https://${c.website.trim()}`
    : null;

  const update: Record<string, unknown> = {
    name: payload.name.trim() || "Traveller",
    bio: payload.bio.trim() || null,
    home_city: payload.homeCity.trim() || null,
    travel_style_tags: payload.travelStyleTags,
    languages: payload.languages,
    countries_visited: payload.countriesVisited,
    profile_gallery: payload.profileGallery,
    contact_phone: cleanPhone,
    contact_whatsapp: cleanWhatsapp,
    contact_email: cleanEmail,
    contact_instagram: cleanInstagram,
    contact_website: cleanWebsite,
    contact_phone_public: c.phonePublic,
    contact_whatsapp_public: c.whatsappPublic,
    contact_email_public: c.emailPublic,
    contact_instagram_public: c.instagramPublic,
    contact_website_public: c.websitePublic,
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
