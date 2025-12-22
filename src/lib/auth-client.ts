import { createSupabaseClient } from "./supabase/client";

export type AppRole = "jobseeker" | "employer" | "admin";

export type SessionProfile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

export async function getClientSessionProfile(): Promise<{
  userId: string | null;
  profile: SessionProfile | null;
}> {
  const supabase = createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!profile) {
    return {
      userId: user.id,
      profile: null,
    };
  }

  return {
    userId: user.id,
    profile: profile as SessionProfile,
  };
}
