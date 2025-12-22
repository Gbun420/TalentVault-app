import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export type AppRole = "jobseeker" | "employer" | "admin";

export const roleHome: Record<AppRole, string> = {
  jobseeker: "/jobseeker",
  employer: "/employer",
  admin: "/admin",
};

export type SessionProfile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

export async function getSessionProfile(): Promise<{
  userId: string | null;
  profile: SessionProfile | null;
}> {
  const supabase = createSupabaseServerClient();
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

export async function requireRole(required: AppRole | AppRole[], redirectTo?: string) {
  const allowed = Array.isArray(required) ? required : [required];
  const { profile } = await getSessionProfile();
  if (!profile) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo || "/")}`);
  }
  if (!allowed.includes(profile.role)) {
    redirect(roleHome[profile.role]);
  }
  return profile;
}
