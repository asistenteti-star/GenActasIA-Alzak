import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "user";
  last_sign_in_at: string | null;
  created_at: string;
};

export async function getCurrentClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const claims = await getCurrentClaims();
  if (!claims) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, last_sign_in_at, created_at")
    .eq("id", claims.sub)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/actas");
  return profile;
}
