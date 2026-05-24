"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/db";

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
  return { supabase, callerId: user.id };
}

function revalidateUserSurfaces(userId?: string) {
  revalidatePath("/admin/users");
  revalidatePath("/admin/overview");
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

export async function setUserRole(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!id) throw new Error("Missing user id.");
  if (!["traveller", "host", "admin"].includes(role)) {
    throw new Error("Invalid role.");
  }

  const { supabase, callerId } = await requireAdmin();
  if (id === callerId && role !== "admin") {
    throw new Error("Can't demote yourself.");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) throw error;
  revalidateUserSurfaces(id);
  redirect(`/admin/users/${id}?role=${role}`);
}

export async function toggleUserVerified(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("verified") ?? "") === "1";
  if (!id) throw new Error("Missing user id.");

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ id_verified: next })
    .eq("id", id);
  if (error) throw error;
  revalidateUserSurfaces(id);
  redirect(`/admin/users/${id}?verified=${next ? 1 : 0}`);
}

export async function suspendUser(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) throw new Error("Missing user id.");
  if (reason.length < 4) {
    throw new Error("Please provide a suspension reason (4+ chars).");
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("set_user_suspension", {
    p_user_id: id,
    p_suspend: true,
    p_reason: reason,
  });
  if (error) throw error;
  revalidateUserSurfaces(id);
  redirect(`/admin/users/${id}?suspended=1`);
}

export async function unsuspendUser(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing user id.");

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("set_user_suspension", {
    p_user_id: id,
    p_suspend: false,
    p_reason: null,
  });
  if (error) throw error;
  revalidateUserSurfaces(id);
  redirect(`/admin/users/${id}?suspended=0`);
}
