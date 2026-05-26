"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ItineraryDay, PackageStatus } from "@/types/db";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return { supabase };
}

function revalidatePackageSurfaces(id?: string) {
  revalidatePath("/admin/originals");
  revalidatePath("/admin/overview");
  revalidatePath("/packages");
  revalidatePath("/search");
  revalidatePath("/");
  if (id) {
    revalidatePath(`/packages/${id}`);
    revalidatePath(`/admin/originals/${id}`);
  }
}

/** Parse a FormData object representing a package edit into the shape the
 *  packages table expects. Throws clear errors on missing/invalid fields. */
function readPackageForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const daysStr = String(formData.get("days") ?? "").trim();
  const priceStr = String(formData.get("price") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const spotsTotalStr = String(formData.get("spots_total") ?? "").trim();
  const spotsLeftStr = String(formData.get("spots_left") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim() as PackageStatus;
  const imagesJson = String(formData.get("images_json") ?? "[]");
  const itineraryJson = String(formData.get("itinerary_json") ?? "[]");
  const tagsRaw = String(formData.get("tags") ?? "");
  const includesRaw = String(formData.get("includes") ?? "");

  if (title.length < 3) throw new Error("Title is too short.");
  if (location.length < 2) throw new Error("Location is required.");
  if (!startDate) throw new Error("Start date is required.");
  const days = Number(daysStr);
  const price = Number(priceStr);
  const spotsTotal = Number(spotsTotalStr);
  const spotsLeft = Number(spotsLeftStr);
  if (!Number.isFinite(days) || days <= 0)
    throw new Error("Days must be a positive number.");
  if (!Number.isFinite(price) || price < 0)
    throw new Error("Price must be ≥ 0.");
  if (!Number.isFinite(spotsTotal) || spotsTotal <= 0)
    throw new Error("Total spots must be > 0.");
  if (!Number.isFinite(spotsLeft) || spotsLeft < 0 || spotsLeft > spotsTotal)
    throw new Error("Spots left must be between 0 and total spots.");
  if (!["draft", "live", "archived"].includes(status)) {
    throw new Error("Invalid status.");
  }

  let images: string[] = [];
  try {
    images = JSON.parse(imagesJson);
    if (!Array.isArray(images)) images = [];
  } catch {
    images = [];
  }
  images = images.map((s) => String(s).trim()).filter(Boolean);

  let itinerary: ItineraryDay[] = [];
  try {
    const parsed = JSON.parse(itineraryJson);
    if (Array.isArray(parsed)) {
      itinerary = parsed
        .map((d, i) => ({
          day: Number(d.day ?? i + 1),
          title: String(d.title ?? "").trim(),
          description: String(d.description ?? "").trim(),
        }))
        .filter((d) => d.title.length > 0);
    }
  } catch {
    itinerary = [];
  }

  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const includes = includesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    title,
    location,
    description,
    days,
    price,
    start_date: startDate,
    spots_total: spotsTotal,
    spots_left: spotsLeft,
    status,
    images,
    itinerary,
    tags,
    includes,
  };
}

export async function createPackage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const patch = readPackageForm(formData);
  const { data, error } = await supabase
    .from("packages")
    .insert(patch)
    .select("id")
    .single();
  if (error) throw error;
  revalidatePackageSurfaces(data?.id);
  redirect(`/admin/originals/${data!.id}?created=1`);
}

export async function updatePackage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing package id.");
  const patch = readPackageForm(formData);
  const { error } = await supabase.from("packages").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePackageSurfaces(id);
  redirect(`/admin/originals/${id}?saved=1`);
}

/** Quick status flip used by Publish / Unpublish / Archive buttons. */
export async function setPackageStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as PackageStatus;
  if (!id) throw new Error("Missing package id.");
  if (!["draft", "live", "archived"].includes(status)) {
    throw new Error("Invalid status.");
  }
  const { error } = await supabase
    .from("packages")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
  revalidatePackageSurfaces(id);
  redirect(`/admin/originals/${id}?status=${status}`);
}

/** Toggle whether a package appears in the homepage hero strip. */
export async function togglePackageFeatured(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "true";
  if (!id) throw new Error("Missing package id.");
  const { error } = await supabase
    .from("packages")
    .update({ featured })
    .eq("id", id);
  if (error) throw error;
  revalidatePackageSurfaces(id);
  redirect(`/admin/originals/${id}?featured=${featured}`);
}

/** Delete a package - refuses if any bookings reference it. Admins should
 *  archive instead of delete once anyone has booked. */
export async function deletePackage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing package id.");

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("item_type", "package")
    .eq("item_id", id);

  if ((count ?? 0) > 0) {
    throw new Error(
      `Can't delete: this package has ${count} booking${count === 1 ? "" : "s"}. Archive it instead.`,
    );
  }

  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) throw error;
  revalidatePackageSurfaces();
  redirect(`/admin/originals?deleted=1`);
}
